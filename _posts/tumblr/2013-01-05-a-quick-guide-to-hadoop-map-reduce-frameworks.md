--- 
layout: post 
title: A Quick Guide to Hadoop Map-Reduce Frameworks 
subject: hadoop 
description: A constantly expanding list of 12+ hadoop frameworks, with code examples and documentation links
tags: 
- hadoop 
- mapreduce 
- java
- pig
- hive
- jvm
--- 

**Updated 2013-04-07** with several walkthroughs (java, hive, pig), listed in-line or [at the bottom of the article](#updates)

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

### Any JVM Language

* Basic Hadoop map-reduce 
  * [documentation](http://hadoop.apache.org/docs/r0.20.2/mapred_tutorial.html)
  * [code sample and walkthrough][1]

### Java

* Cascading ([documentation](http://www.cascading.org/))
* Crunch ([documentation](https://github.com/cloudera/crunch))

### Clojure

* Cascalog ([documentation](https://github.com/nathanmarz/cascalog))

### Scala

* Scrunch ([documentation](https://github.com/cloudera/crunch/tree/master/scrunch))
* Scalding ([documentation](https://github.com/twitter/scalding))
* Scoobi ([documentation](https://github.com/NICTA/scoobi))

### Any Language \[low-med level\]

* hadoop-streaming ([documentation](http://hadoop.apache.org/docs/r0.15.2/streaming.html))

### Ruby

* Wukong ([documentation](https://github.com/infochimps-labs/wukong))
* Cascading JRuby ([documentation](https://github.com/etsy/cascading.jruby))

### PHP

* HadooPHP ([documentation](https://github.com/dzuelke/HadooPHP))

### Python

* MR Job ([documentation](https://github.com/Yelp/mrjob))
* Dumbo ([documentation](https://github.com/klbostee/dumbo))
* Hadooppy ([documentation](https://github.com/bwhite/hadoopy))
* Pydoop ([documentation](http://pydoop.sourceforge.net/docs/))

### R

* RHadoop ([documentation](https://github.com/RevolutionAnalytics/RHadoop))

### Special Scripting Languages \[high level\]

* Hive 
  * [documentation](http://hive.apache.org/)
  * [code sample and walkthrough][2]

* Pig 
  * [documentation](http://pig.apache.org/)
  * [code sample and walkthrough][3]

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


## Updates {#updates}

* 2013-02-09: [map reduce walkthrough published][1]
* 2013-02-21: [hive walkthrough published][2]
* 2013-04-07: [pig walkthrough published][3]

[1]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[2]: /2013/02/20/Real-World-Hadoop---Implementing-Left-Outer-Join-in-Hive.html
[3]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html