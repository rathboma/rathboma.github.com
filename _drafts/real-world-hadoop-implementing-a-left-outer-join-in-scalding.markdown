---
layout: post
title: "Real World Hadoop - Implementing a Left Outer Join in Scalding"
description: A tutorial to using scalding to join two datasets and run an aggregation query. (Real World Hadoop series)
subject: hadoop
layout: post
tags:
- map-reduce
- secondary sort
- hadoop
- integration testing
- hdfs
- scala
- scalding
---

This article is part of [my guide to map reduce frameworks][1], in which I implement a solution to a real-world problem in each of the most popular hadoop frameworks.

If you're impatient, you can find the code for the map-reduce implementation [on my github][5], otherwise, read on!

## The Problem

Let me quickly restate the problem from [my original article][2].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold.

## The Solution (in words)

1. join transactions to users using `location.user-id`.
  - now we have a list of all transactions, complete with information on the purchaser.
2. for each `product-id`, count the number of distinct locations for that product.


## The Scalding Solution




[1]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[5]: https://github.com/rathboma/hadoop-framework-examples/tree/master/java-mapreduce
