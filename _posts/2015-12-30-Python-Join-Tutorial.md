---
title: Real World Hadoop - Real World Hadoop Guide for Python 
layout: post
description: Data processing pipelines with Spark
topic: engineering
author: matthew_rathbone
coauthor:
  name: Elena Akhmatova
  link: https://ru.linkedin.com/pub/elena-akhmatova/3/877/266
categories:
- hadoop
tags:
- python
- hadoop
- hadoop-streaming
---

> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
>  
> One of the articles in the guide [Hadoop Python MapReduce Tutorial for Beginners][13] has already introduced the reader to the basics of hadoop-streaming with Python. This is the next logical step in a quest to learn how to use Python in map reduce framework defined by Hadoop.  
> 

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

The [Python article][13] i mentioned earlier does not solve this problem. It has a focus on understanding the basics of working with Hadoop-streaming and Python. 

## The Python Solution

Again, this article is a follow up for my [earlier article][13] on [Python][1] that shows the basics of using Python for map reduce in Hadoop. Please refer to it to gather basic understanding on how to write mappers and reducers in Python for Hadoop. Here we focus on implementing join and count distinct by key in Python and will assume some preliminary understanding of hadoop-streaming. 

## Demonstration Data

As previously (and here we mean "versus" the solutions [in java][7], [with hive][8] and [with pig][9]) we use two datasets called `users` and `transactions`. 

{% highlight bash %}
users
1	matthew@test.com	EN	US
2	matthew@test2.com	EN	GB
3	matthew@test3.com	FR	FR
{% endhighlight %}

and

{% highlight bash %}
transactions
1	1	1	300	a jumper
2	1	2	300	a jumper
3	1	2	300	a jumper
4	2	3	100	a rubber chicken
5	1	3	300	a jumper
{% endhighlight %}

**This time though they will constitute the same input dataset!** Soon it will become clear why.

{% highlight bash %}
hdfs dfs -mkdir input

hdfs dfs -put ./users.txt input
hdfs dfs -put ./transactions.txt input
{% endhighlight %}

## Code

We divide the task into two parts. First part solves the question of a join. Second part is responsible for counting distinct by key.

The code for the both parts of the solution and data used in this post can be found in my [`hive examples` GitHub repository][github].

## Join

Mapper:

{% highlight python %}
#!/usr/bin/env python
import sys
for line in sys.stdin:
	user_id = ""
	product_id = "-"
	location = "-"
	line = line.strip()         
	splits = line.split("\t")         
	if len(splits) == 5:
		user_id = splits[2]
		product_id = splits[1]
	else:
		user_id = splits[0]
		location = splits[3]                   
	print '%s\t%s\t%s' % (user_id,product_id,location)
{% endhighlight %}

Reducer:
{% highlight python %}
#!/usr/bin/env python
import sys
import string

last_user_id = None
cur_location = "-"

for line in sys.stdin:
    line = line.strip()
    user_id,product_id,location = line.split("\t")

    if not last_user_id or last_user_id != user_id:
        last_user_id = user_id
        cur_location = location
    elif user_id == last_user_id:
        location = cur_location
        print '%s\t%s' % (product_id,location)
{% endhighlight %}

The Mapper reads both datasets and distinguishes them by the number of columns. Transactions data has more columns than the users data.

The aim of the mapper is to select the data we need to calculate the number of unique locations in which each product has been sold, namely user_id, poduct_id and location, and represent the data in such a way so it would be easy for the reducer to read it line by line. The Reducer will substitute an absent value of location into the rows where user_id and product_id are present. That is the rows from the transactions table.

Using the fact that the data will be sorted by key in Hadoop, we sort it by user_id and product_id (using `-Dstream.num.map.output.key.fields=2`) when running in hadoop-streaming, or applying `sort` when testing from command line: 

{% highlight bash%}
cat transactions_and_users.txt | ./joinMapperTU.py | sort
{% endhighlight %}

Mapper will output the following:

{% highlight bash%}
1	-	US
1	1	-
2	-	GB
2	1	-
2	1	-
3	-	FR
3	1	-
3	2	-
{% endhighlight %}

For each key Reducer will first set location 

{% highlight python%}
if not last_user_id or last_user_id != user_id:
    last_user_id = user_id
    cur_location = location
{% endhighlight %}

and then add this location to the lines where it is missing:

{% highlight python%}
elif user_id == last_user_id:
    location = cur_location
    print '%s\t%s' % (product_id,location)
{% endhighlight %}

Thus, the for each user_id Reducer will get from the mapper a sorted by user_id and product_is list of lines, like:

{% highlight bash%}
3	-	FR
3	1	-
3	2	-
{% endhighlight %}

Reducer reads the first line - `3	-	FR`.

It remembers the location - `FR` - from it.

Then 

`3	1	-` -> `3	1	FR` -> (omitting user_id) -> `1	FR`

`3	2	-` -> `3	2	FR` -> (omitting user_id) -> `2	FR`

{% highlight bash%}
cat transactions_and_users.txt | ./joinMapperTU.py | sort | ./joinReducerTU.py | sort
{% endhighlight %}

results in

{% highlight bash%}
1	FR
1	GB
1	GB
1	US
2	FR
{% endhighlight %}


## Counting Distinct by Key

Mapper:
{% highlight python %}
#!/usr/bin/env python
import sys
import string

for line in sys.stdin:
    line = line.strip()
    product_id,location = line.split("\t")
    print '%s\t%s' % (product_id,location)
{% endhighlight %}

Reducer:
{% highlight python %}
#!/usr/bin/env python
import sys
import string

last_product_id = None
cur_location = ""
count_locations=0

for line in sys.stdin:
    line = line.strip()
    product_id,location = line.split("\t")
    # if this is the first iteration
    if not last_product_id:
        last_product_id = product_id
        cur_location = location
        count_locations = 1

    if product_id == last_product_id:
        if location != cur_location:
            count_locations = count_locations + 1
            cur_location = location
    else:
        print '%s\t%s' % (last_product_id,count_locations)
        last_product_id = product_id
        cur_location = location
        count_locations = 1

print '%s\t%s' % (product_id,count_locations)
{% endhighlight %}

In this case Mapper is more or less an identity Mapper. In the Reducer phase we again exploit the fact that entries are ordered by key. We go through a product_id while it has the same value and calculate the number of distinct location in those rows. 

To calculate the number of distinct locations we rather calculate a number of changes in location values.

## Running the code

We can run the code for testing without Hadoop:

{% highlight bash%}
cat transactions_and_users.txt | ./joinMapperTU.py | sort | ./joinReducerTU.py | sort | ./joinMapperTU1.py | sort | ./joinReducerTU1.py
{% endhighlight%}

or using hadoop-streaming

{% highlight bash%}
bin/hadoop jar ./contrib/streaming/hadoop-0.20.2-streaming.jar -Dmapred.reduce.tasks=1 -Dstream.num.map.output.key.fields=2 -input transactions_and_users -output transactions_and_users_output -file /path/to/joinMapperTU.py -file /path/to/joinReducerTU.py -mapper joinMapperTU.py -reducer joinReducerTU.py

bin/hadoop jar ./contrib/streaming/hadoop-0.20.2-streaming.jar -Dmapred.reduce.tasks=1 -Dstream.num.map.output.key.fields=2 -input transactions_and_users_output -output transactions_and_users_output_final -file /path/to/joinMapperTU1.py -file /path/to/joinReducerTU1.py -mapper joinMapperTU1.py -reducer joinReducerTU1.py
{% endhighlight%}

The result in both cases is:
{% highlight bash%}
1	3
2	1
{% endhighlight%}

## Testing

It is best to test each part of the process separately. Both Mappers and Reducers.

## Thoughts

It was not hard to write the code for both, join and count distinct. An ability to quickly test what is happening by just running a mapper or a reducer or both from a command line with a small input data set is convenient.

I would not use this solution unless using python is a must, as the code is very error prone and is not easy to read.

## Hadoop Streaming Resources 

Documentation on [Hadoop Streaming][2] by Apache.

## Further Reading

More on writing in Python for Hadoop you may find in 

O'REILLY Publishing ‘Hadoop with Python’ Book

by Donald Miner: [OREILLY][3].

[1]: https://www.python.org
[2]: https://hadoop.apache.org/docs/r1.2.1/streaming.html
[3]: http://www.oreilly.com/programming/free/hadoop-with-python.csp
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[13]: http://blog.matthewrathbone.com/2013/11/17/python-map-reduce-on-hadoop---a-beginners-tutorial.html