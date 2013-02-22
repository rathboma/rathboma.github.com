---
title: Real World Hadoop - Implementing a Left Outer Join in Hive
layout: post
description: How to use hive to perform a left outer join. Includes a comparison with performing the same query in java map reduce.
subject: hadoop
tags:
- hive
- big data
- hadoop
- sql
- java
---

This article is part of [my guide to map reduce frameworks][1], in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.

## The Problem

Let me quickly restate the problem from [my original article][2].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

I previously implemented a solution to this problem using [the standard map-reduce api in java][3]. It took ~500 lines of code, and many many hours of my spare time.

## The Hive Solution

[Hive][6] is a tool which translates SQL queries into sequences of map-reduce jobs. You interact with it much the same way you interact with a traditional database - it has a command-line shell for interactive querying, and if you deploy the included [thrift][7] server you can interact with it from any programming language or even use the JDBC drivers.

### Setup

Before querying our datasets, we have to create table schemas that represent the data. Like a regular database you cannot query data until you define a table. Unlike a regular database, hive tables can point to data that already exists (external tables).

Here are our table definitions. You can see that we're specifying how the data is delimited (`ROW FORMAT`), and where the data is stored (`LOCATION`). In a real Hadoop deployment, the LOCATION is a directory on HDFS, when running a 'local' cluster it is simply a file path.

Note the `LOCATION` paths must be absolute.

#### Users Table

{% highlight sql %}

CREATE EXTERNAL TABLE users(
  id INT, 
  email STRING, 
  language STRING, 
  loc STRING
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY '\t'
LOCATION '/data/users';

{% endhighlight %}

#### Transactions Table

{% highlight sql %}

CREATE EXTERNAL TABLE transactions(
  id INT, 
  productId INT, 
  userId INT, 
  purchaseAmount INT, 
  itemDescription STRING
)
ROW FORMAT DELIMITED
  FIELDS TERMINATED BY '\t'
LOCATION '/data/transactions';

{% endhighlight %}


### The Query

Now our tables are defined, we can get on with the meat of the problem:

{% highlight sql %}

SELECT 
  productId, 
  count(distinct loc)
FROM
  transactions t
LEFT OUTER JOIN 
  users u on t.userId = u.id
GROUP BY productId;

{% endhighlight %}

That's it, 8 lines of SQL, and I'm pretty liberal with my newlines. Compared to ~500 lines of Java, this is a big improvement.

Below are the results of the query, I ran it on the [same data used in the Java example][8]. Both the query, and the setup script [can be seen on github][9]. The results are consistent with the Java example's results. product '1' was sold in 3 locations, product 2 was only sold in one location.

{% highlight sh %}

OK
1 3
2 1
Time taken: 7.076 seconds

{% endhighlight %}

More importantly, we can change our query pretty easily. Lets say we want the product description rather than the product ID, changing the query is trivial:

{% highlight sql %}

SELECT 
  itemDescription, 
  count(distinct loc)
FROM
  transactions t
LEFT OUTER JOIN 
  users u on t.userId = u.id
GROUP BY itemDescription;

{% endhighlight %}

Making this change would be time consuming (to say the least) in our java example. You'd probably end up generalizing the whole thing and building your own query language.

Such comments might be a little unfair to Java. Hive is clearly well-suited to this use case, yet would be cumbersome in situations more suited to a programming framework.

## Thoughts

- The amount of code required for Hive is much less than the code required for Java.
- Although the language is more concise for data querying, you can't do anything complex like make HTTP queries, or update other systems.
- To query a dataset you have to declare a table. If you have a lot of datasets, you have a lot of tables.
- Hive queries are harder to test than simply using a unit-testing framework.


[1]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[3]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[5]: https://github.com/rathboma/hadoop-framework-examples/tree/master/java-mapreduce
[6]: http://hive.apache.org/
[7]: http://thrift.apache.org/
[8]: https://github.com/rathboma/hadoop-framework-examples/blob/master/java-mapreduce/src/test/java/com/matthewrathbone/example/AppTest.java
[9]: https://github.com/rathboma/hadoop-framework-examples/tree/master/hive