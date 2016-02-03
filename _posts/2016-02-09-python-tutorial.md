---
title: Hadoop MapReduce Python Join Tutorial with Example Code
layout: post
description: Joining and analysing data in Hadoop using Python MapReduce. I compare this solution to the same solution in other MapReduce frameworks.
topic: engineering
author: matthew_rathbone
published: false
coauthor:
  name: Elena Akhmatova
  link: https://ru.linkedin.com/pub/elena-akhmatova/3/877/266
categories:
- hadoop
tags:
- python
- hadoop
- hadoop-streaming
image:
  url: /img/python.jpg
  author:
    url: https://www.flickr.com/photos/archangel12/5466310296
    name: Archangel12

---

> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
>  
> One of the articles in the guide [Hadoop Python MapReduce Tutorial for Beginners][13] has already introduced the reader to the basics of hadoop-streaming with Python. This is the next logical step in a quest to learn how to use Python in map reduce framework defined by Hadoop.  
> 

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. Users (id, email, language, location)
2. Transactions (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

My [beginners guide to python MapReduce][13] does not solve this problem, but provides a more gentle introduction to running MapReduce with Python. Start there if you're just getting started with these concepts.

## The Python Solution

This solution assumes some preliminary understanding of hadoop-streaming and python, and uses concepts introduced in my [earlier article][13].

## Demonstration Data

As in previous articles ([java MR][7], [hive][8] and [pig][9]) we use two datasets called `users` and `transactions`. 

{% highlight bash %}
> cat users
1	matthew@test.com	EN	US
2	matthew@test2.com	EN	GB
3	matthew@test3.com	FR	FR
{% endhighlight %}

and

{% highlight bash %}
> cat transactions
1	1	1	300	a jumper
2	1	2	300	a jumper
3	1	2	300	a jumper
4	2	3	100	a rubber chicken
5	1	3	300	a jumper
{% endhighlight %}

One big difference with Python MapReduce is that we treat them **as a single dataset** when we are writing our Mapper. I will show you how just below.

To start, let's upload these files to HDFS.

{% highlight bash %}
hdfs dfs -mkdir input

hdfs dfs -put ./users.txt input
hdfs dfs -put ./transactions.txt input
{% endhighlight %}

## Code

This job logically has two parts, so I will divide the code in the same way. Firstly we solve the problem of joining the two datasets to associate a location to each purchase, and secondly we use this joined dataset to evaluate how many unique locations each product has been sold in.

The code for the both parts of the solution and data used in this post can be found in my [GitHub repository][github].

### Part 1: Joining

Mapper:

{% highlight python %}

import sys
for line in sys.stdin:
    # Setting some defaults
	user_id = ""
	product_id = "-"
	location = "-"

	line = line.strip()
	splits = line.split("\t")
	if len(splits) == 5: # Transactions have more columns than users
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

The Mapper reads both datasets and distinguishes them by the number of fields in each row. Transaction records have 5 fields, users have only 4.


The mapper does two things:

* For transactions - Extract the `user_id` and `product_id`
* For users - Extract the `user_id` and the `location`

The mapper outputs three fields: `user_id, product_id, location`.

The output will look something like this:

{% highlight bash %}
# From transaction data:
2, 1, -
# From user data:
2, -, US
{% endhighlight %}


By using a feature of the streaming api we can tell Hadoop to treat BOTH of the first two fields as a combined key. This allows us to guarantee the order in which the reducer will recieve data:

1. User record with location (now we can remember the location)
2. Each user purchase in turn, ordered by product id.

We do this by specifying an option on the command line: `-Dstream.num.map.output.key.fields=2`.
If we want to test this without Hadoop we can just use `sort`. 

{% highlight bash%}
cat *.txt | ./joinMapperTU.py | sort
{% endhighlight %}

The output will look like this (I added notes):

{% highlight bash%}
1	-	US # user record
1	1	-  # transaction record
2	-	GB # user record
2	1	-  # transaction record
2	1	-  # transaction record
3	-	FR # user record
3	1	-  # transaction record
3	2	-  # transaction record
{% endhighlight %}

For each new user the Reducer will first remember that user's location:

{% highlight python%}

if not last_user_id or last_user_id != user_id: # if this is a new user
    last_user_id = user_id
    cur_location = location

{% endhighlight %}

and then add this location to the transactions:

{% highlight python%}

elif user_id == last_user_id:
    location = cur_location
    print '%s\t%s' % (product_id,location)

{% endhighlight %}


So the reducer will take an input that looks like this (`user_id, product_id, location`):

{% highlight bash%}
3	-	FR
3	1	-
3	2	-
{% endhighlight %}

Extract the location, and associate with each product id to produce this:

{% highlight bash%}
1	FR
2	FR
{% endhighlight %}

We can run the whole join pipeline easily without using Hadoop:

{% highlight bash%}

cat *.txt | ./joinMapperTU.py | sort | ./joinReducerTU.py | sort

{% endhighlight %}

And get a list of product/location pairs for stage 2. This shows the location of the purchaser (user) for each transaction, where the key is the product ID. Products are repeated the number of times that it appeared in a transaction.

{% highlight bash%}
1	FR
1	GB
1	GB
1	US
2	FR
{% endhighlight %}


## Stage 2: Counting Distinct Locations for each Product

Mapper:

In fact we can just use `cat` here if we like.

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

    # else we're transitioning from the last product to a new one
    else:
        print '%s\t%s' % (last_product_id,count_locations)
        last_product_id = product_id
        cur_location = location
        count_locations = 1

# finally print out the last product / location combo. This is a gotcha! Easy to forget this line :-)
print '%s\t%s' % (product_id,count_locations)
{% endhighlight %}

Our mapper just echos it's input and the bulk of work happens in the reducer. In the Reducer phase we again exploit the fact that entries are ordered by key. Notice that unlike regular MapReduce this reducer's API does not distinguish between keys and receives all of them in a big long list, so our reducer has to do it's own bookeeping. See my [beginners article][13] for more of an explaination. 

So we go through the list and count the number of locations we see for each product_id, whilst making sure we transition between products properly.

## Running the code

Again, this is easy to test without Hadoop:

{% highlight bash%}
cat *.txt | ./joinMapperTU.py | sort | ./joinReducerTU.py | sort | ./joinMapperTU1.py | sort | ./joinReducerTU1.py
{% endhighlight%}

Or using hadoop-streaming in two steps:

{% highlight bash%}
bin/hadoop jar ./contrib/streaming/hadoop-0.20.2-streaming.jar -Dmapred.reduce.tasks=1 -Dstream.num.map.output.key.fields=2 -input transactions_and_users -output transactions_and_users_output -file /path/to/joinMapperTU.py -file /path/to/joinReducerTU.py -mapper joinMapperTU.py -reducer joinReducerTU.py

bin/hadoop jar ./contrib/streaming/hadoop-0.20.2-streaming.jar -Dmapred.reduce.tasks=1 -Dstream.num.map.output.key.fields=2 -input transactions_and_users_output -output transactions_and_users_output_final -file /path/to/joinMapperTU1.py -file /path/to/joinReducerTU1.py -mapper joinMapperTU1.py -reducer joinReducerTU1.py
{% endhighlight%}

The result in both cases is correct:

{% highlight bash%}
1	3
2	1
{% endhighlight%}

## Testing

Testing Hadoop streaming pipelines is harder than testing regular MapReduce pipelines because our tasks are just scripts. There are some more structured Python frameworks that help in both development and testing of Hadoop pipelines.

## Thoughts

Our Python code is very legible and does not require as much boiler plate as regular Java MapReduce. That said it does require us to use some bookeeping to make sure the mappers and reducers work correctly. The ability to quickly test using the command line is very nice, as is the inclusion of a lot of functionality in the streaming API jar itself.

To be frank -- I would avoid using python streaming to write MapReduce code for Hadoop. If you have to use Python I suggest investigating a python framework like [Luigi](https://github.com/spotify/luigi) or [MRJob](https://github.com/Yelp/mrjob). Hadoop streaming is powerful, but without a framework there are lots of easy ways to make mistakes and it's pretty hard to test.

## Hadoop Streaming Resources 

Documentation on [Hadoop Streaming][2] by Apache.

Check out the O'REILLY ‘Hadoop with Python’ Book by Donald Miner: [OREILLY][3].

[1]: https://www.python.org
[2]: https://hadoop.apache.org/docs/r1.2.1/streaming.html
[3]: http://www.oreilly.com/programming/free/hadoop-with-python.csp
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[13]: http://blog.matthewrathbone.com/2013/11/17/python-map-reduce-on-hadoop---a-beginners-tutorial.html
[github]: https://github.com/rathboma/hadoop-framework-examples/
