---
title: Apache Spark Tutorial with Example Code
date: 2015-12-14
subject: hadoop
description: In the continuation of my MapReduce guide I take a look at how to solve a real world problem using Spark and Scala
layout: post
published: true
image:
  url: /img/sparks.jpg
  author:
    name: blair_25
    url: https://www.flickr.com/photos/blair25/3240686470

---

> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
>  
> Spark is isn't actually a MapReduce framework. Instead it is a general-purpose framework for cluster computing, however it can be run, and is often run, on Hadoop's YARN framework. Because it is often associated with Hadoop I am including it in [my guide to map reduce frameworks][4] as it often serves a similar function. Spark was designed to be fast for interactive queries and iterative algorithms that Hadoop MapReduce is a bit slow with.
> 


## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Solution

I've published the solution to this problem over on the [Beekeeper](http://beekeeperdata.com) Blog. 

### [Read the Spark solution and walkthrough here](http://beekeeperdata.com/posts/hadoop/2015/12/14/spark-scala-tutorial.html).

[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
