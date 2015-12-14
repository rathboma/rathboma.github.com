---
layout: post
title: "Hadoop Map-Reduce Framework Tutorials with Examples"
subject: hadoop
description: "A constantly expanding list of 12+ hadoop frameworks, with code examples and documentation links"
tags: 
  - hadoop
  - mapreduce
  - java
  - pig
  - hive
  - jvm
published: true
---

 

**Updated October 2015** Full sample code is available for many frameworks, see the list [at the bottom of the article](#updates)

There are a lot of frameworks for writing map-reduce pipelines for Hadoop, but
it can be pretty hard to navigate everything to get a good sense of what
framework you should be using. I felt very overwhelmed when I started working
with Hadoop, and this has only gotten worse for newcomers as the number of
frameworks keeps growing.

Having now explored a number of frameworks, I thought it would be useful to
list the major frameworks and provide examples of performing a common
operation in each framework.

Generally speaking, the goal of each framework is to make building pipelines
easier than when using the basic map and reduce interface provided by hadoop-
core. This usually means the frameworks do not require you to write these
functions at all, but something more high-level that the framework can
'compile' into a pipeline of map-reduce jobs. This is particularly true for
the higher level frameworks (such as hive), which don't really require any
knowledge of programming to operate.

## List of Map Reduce Frameworks for each language

| Java |
| ---------------- |
| Basic Map Reduce | [walkthrough][1] | [docs](http://hadoop.apache.org/docs/r0.20.2/mapred_tutorial.html) |
| Cascading | [walkthrough][cascading-walkthrough]| [docs](http://cascading.org) |
| Crunch | *coming soon* | [docs](https://github.com/cloudera/crunch) |
{: .table.table-striped .table-fixed}

| Clojore |
|---|
| Cascalog | *coming soon* |[docs](https://github.com/cloudera/crunch) |
{: .table.table-striped .table-fixed}

| Scala|
|---|
| Scrunch | *coming soon* |[docs](https://github.com/cloudera/crunch/tree/master/scrunch) |
| Scalding | [walkthrough][scalding-walkthrough] | [docs](https://github.com/twitter/scalding) |
| Scoobi | [walkthrough][scoobi-walkthrough] | [docs](https://github.com/NICTA/scoobi) |
{: .table.table-striped .table-fixed}

| Any Language |
|--|
| Hadoop Streaming | *coming soon* | [docs](http://hadoop.apache.org/docs/r0.15.2/streaming.html) |
{: .table.table-striped .table-fixed}

| Ruby |
| -- |
| Wukong | *coming soon* | [docs](https://github.com/infochimps-labs/wukong) |
| Cascading JRuby | *coming soon* | [docs](https://github.com/etsy/cascading.jruby) |
{: .table.table-striped .table-fixed}


| PHP (yes, really) |
| --- |
| HadooPHP | *coming soon* | [docs](https://github.com/dzuelke/HadooPHP) |
{: .table.table-striped .table-fixed}

| Python |
| --- |
| MR Job | *coming soon* |[docs](https://github.com/Yelp/mrjob) |
| Dumbo | *coming soon* | [docs](https://github.com/klbostee/dumbo) |
| Hadooppy | *coming soon* | [docs](https://github.com/bwhite/hadoopy) |
| Pydoop | *coming soon* | [docs](http://pydoop.sourceforge.net/docs/) |
| Luigi | *coming soon* | [docs](https://github.com/spotify/luigi) |
{: .table.table-striped .table-fixed}

| R |
| --- |
| RHadoop | *coming soon* | [docs](https://github.com/RevolutionAnalytics/RHadoop) |
{: .table.table-striped .table-fixed}

| New Languages |
| --- |
| Hive | [walkthrough][2] | [docs](http://hive.apache.org/) |
| Pig | [walkthrough][3] | [docs](http://pig.apache.org/) |
{: .table.table-striped .table-fixed}


| Other |
|---|
| Spark | [walkthrough](http://beekeeperdata.com/posts/hadoop/2015/12/14/spark-scala-tutorial.html) | [docs](http://spark.apache.org/) |
{: .table.table-striped .table-fixed}


please tweet me if I have missed any: [@rathboma](http://twitter.com/rathboma)

## Framework Walkthroughs ## {#walkthrough}

I will create a separate article for each framework ( [current articles listed here](#updates) ) in which I will build a
small map-reduce pipeline to do the following:

Given two (fake) datasets:

1. A set of user demographic information containing \[id, email, language, location\]
2. A set of item purchases, containing fields \[transaction-id, product-id, user-id, purchase-amount, product-description\]

Calculate the number of locations in which a product is purchased.

Whilst this example is fairly simple, it requires a join of two datasets, and
a pipeline of two mapreduce jobs. Step one joins users to purchases, while
step two aggregates on location. These two things in unison should help
demonstrate the unique attributes of each framework much better than the
simple Word Count example which is usually used as demonstration.

As I complete each example I will update this document with a link to each
example.

## My Commonly used Frameworks

* Hive -- Hive is amazing because anyone can query the data with a little knowledge of SQL. Hook it up to a visual query designer and you don't even need that.
* Pig -- the perfect framework for prototyping and quick-investigation. It's a simple scripting language with a bunch of powerful map-reduce specific features.
* Scoobi -- I use this a lot to build pipelines in Scala because it's very functional, and in many way's you just treat the data like a regular list, which is great.
* Raw Map/Reduce -- Sometimes I like to program directly to the API, especially when doing something mission critical. I also find the individual map and reduce functions easier to test.


## Updates

* 2013-02-09: [map reduce walkthrough published][1]
* 2013-02-21: [hive walkthrough published][2]
* 2013-04-07: [pig walkthrough published][3]
* 2013-11-03: [scoobi walkthrough published][scoobi-walkthrough]
* 2015-06-25: [cascading walkthrough published][cascading-walkthrough]
* 2015-10-19: [scalding walkthrough published][scalding-walkthrough]

[1]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[2]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[3]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[hadoop-book]:http://www.amazon.com/gp/product/1449311520/ref=as_li_qf_sp_asin_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=1449311520&linkCode=as2&tag=matratsblo-20
[hive-book]: http://www.amazon.com/gp/product/1449319335/ref=as_li_ss_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1449319335&linkCode=as2&tag=matratsblo-20
[pig-book]: http://www.amazon.com/gp/product/1449302645/ref=as_li_ss_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1449302645&linkCode=as2&tag=matratsblo-20
[scoobi-walkthrough]:/2013/11/03/real-world-hadoop---implementing-a-left-outer-join-with-scoobi.html
[cascading-walkthrough]:/2015/06/25/real-world-hadoop---implementing-a-left-outer-join-in-java-with-cascading.html
[scalding-walkthrough]:http://blog.matthewrathbone.com/2015/10/20/scalding-tutorial.html
