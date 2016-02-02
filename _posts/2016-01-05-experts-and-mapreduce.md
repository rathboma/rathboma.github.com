---
title: 5 Industry Veterans Pick Their Favorite MapReduce Frameworks
date: 2016-01-05
subject: hadoop
description: "Software engineers from Cloudera, Foursquare, Spredfast, JauntVR, and Elondina chat with me about their favorite Hadoop MapReduce frameworks and why they like them."
layout: post
published: true
image:
  url: /img/elephant.jpg
  author:
    url: https://www.flickr.com/photos/rabanito/3416817267
    name: Senorhorst Jahnsen
---


Over the last 2 years I've published [numberous MapReduce framework guides][1], but I've given no real direction on **which** framework to use and why.

If you're just getting started with Hadoop and MapReduce I know figuring out where to start can be very overwhelming. I figured instead of flapping my own opinions about what frameworks to use I'd reach out to folks who are writing production MapReduce code every day and ask them for their thoughts.

## Questions

I asked my experts 3 questions about the frameworks that they use:

> 1. Which MapReduce Framework do you prefer to work in?
> 2. Why do you like using it vs regular MapReduce?
> 3. Why do you like using it vs other MapReduce frameworks?

Note that opinions expressed by those interviewed are personal and do not nessecerily represent employer opinions.


## Experts

### [Joe Stein](https://twitter.com/charmalloc), CEO of [Elodina](http://elodina.net)
![Joe Stein](/img/experts/joe-stein.jpg){: .small-img .pull-left}

As well as running Elodina, Joe runs [All Things Hadoop](http://allthingshadoop.com/), and talks about distributed computing at a range of conferences and events.

<div class="clearfix"></div>



### [Sam Wang](https://twitter.com/samwang), Engineering Manager at [Foursquare](http://foursquare.com)
![Sam Wang](/img/experts/sam-wang.png){: .small-img .pull-left}
Sam was so good at thinking and coding in MapReduce that he now runs the data infrastructure team that keeps Foursquare's petabyte+ cluster humming.

<div class="clearfix"></div>

### David Leifker, Software Architect at [Spredfast](http://spredfast.com)
![David Leifker](/img/experts/david-leifker.jpg){: .small-img .pull-left}
David is a systems engineer with a focus on data firehoses, real time processing, and big data architecture.

<div class="clearfix"></div>

### [Eli Collins](https://twitter.com/elicollins), Chief Technologist at [Cloudera](http://cloudera.com)
![Eli Collins](/img/experts/eli-collins.jpg){: .small-img .pull-left}
Eli runs a cloudera engineering group and helps set the technical vision of the company. If anyone knows the direction of emerging big data technologies, it's him.

<div class="clearfix"></div>

### [Andrew Walkingshaw](https://twitter.com/covert), Senior Software Engineer at [Jaunt VR](http://www.jauntvr.com)
![Andrew Walkingshaw](/img/experts/andrew-walkingshaw.jpg){: .small-img .pull-left}
Andrew is a formiddable engineer with a focus on big data technologies and data science. He's built recommendation systems at Flipboard, and is now designing and building the analytics systems at Jaunt VR.

<div class="clearfix"></div>

## Which MapReduce Framework do you prefer to work in?

* Joe Stein - Scalding
* Sam Wang - Scalding
* David Leifker - Spark
* Eli Collins - Crunch
* Andrew Walkingshaw - Pig


## Why do you like your framework vs regular Java MapReduce?

* **Joe Stein - Scalding**
  
  It is easy to reason about composing data together when the language is composing functions around the data.

* **Sam Wang - Scalding**

  Implementing intuitive joins with Scala types in Scalding is very easy, and is probably the number one feature that our engineers love over writing in any other framework.

  In our ecosystem, writing joins in native MR always required writing throw-away container types for joins in Thrift, which added an unnecessary layer of complexity to a task. Also, implementing any of the join primitives in Scalding in MR (outerJoin, hashJoin, etc.) is very cumbersome in vanilla MR, and usually resulted in code that was not reusable from task to task.

  Being able to depend on the native Scalding serialization for Scala types is also convenient, as users don't have to think too hard about how data flows over a wire, and how to serialize and deserialize their complex types. Finally, there's just less boilerplate code in general, and the code is much more readable to anyone skimming a flow to figure out exactly what the salient bits of it are.

* **David Leifker - Spark**

  Simply put Spark is better able to execute iterative operations faster then M/R. This is readily apparent for ML applications. Currently there is MLlib for Spark, but Mahout is also shifting to use Spark for this reason. The ability to cache, or pin, RDDs in memory also helps to speed up certain operations.

* **Eli Collins - Crunch**

  It's easier to develop and debug _pipelines_ than stitching together individual MR jobs

* **Andrew Walkingshaw - Pig**

  If I need Hadoop, I'm usually doing something which I can't conveniently do by some other means – for instance by consolidating all the data onto a single machine, by sampling, or by using a relational database. Often, that means I'm not entirely sure how best to build the thing I need when I start out. It's a research process.

  Here, being able to work in Pig's interactive shell, Grunt, is a big win over raw Map/Reduce. In particular, I find it very helpful when getting the basic data-loading-and-reshaping parts of the pipeline up and running. Most of that grouping-and-sorting work, which would otherwise be a bunch of boilerplate, is well handled by any of the frameworks out there; for me, that's a compelling reason to avoid writing raw M/R.

  However, for the kind of problems for which I find myself using Hadoop, I'll usually need to implement some specific piece of business logic. For example, one problem which crops up a lot is sessionization – the heuristics you want for that are typically pretty idiosyncratic to your application. 

  I like to be able to work on those in the same iterative, interactive style as when I'm building the ETL part of the pipeline, and Pig's straightforward UDF interface (and Jython integration) help out substantially there.



## Why do you like your framework vs other MapReduce frameworks?

* **Joe Stein - Scalding**

  After Scalding I would skip over them all and go straight to Python streaming as my next default.


* **Sam Wang - Scalding**

  Foursquare arrived at Scalding via an organic process, which was partially technical, and partially cultural. We had previously invested in a framework called Scoobi, but we wanted to switch to a framework with a richer ecosystem of developers and support.

  The Scalding API looks similar to writing Scoobi, so the switch was not as dramatic as if we had switched to something that looked completely different. We had already invested a lot in tuning our cluster to run MR version 1 jobs, and the appeal of Scalding working out of the box on our existing infrastructure was the other major deciding factor in why we chose it.

  Scalding, at the time, seemed like the best way to mix our existing codebase with more Scala-idiomatic join primitives and classes.


* **David Leifker - Spark**

  Honestly, it was a natural fit for the type of problems I was looking to solve, those being oriented around ML. If you are looking to perform non-iterative batch processing that cannot fit in the distributed memory of your cluster, M/R is still the likely winner.

  Spark compared to say Storm is a question of is it easier to move your data or read it in place. It depends on where the data is. If the bulk of the data is already collected and stored in the cluster, its easier to reason about moving processing to the where the data is stored, potentially changing how its distributed. Compare that to moving already written data through a topology of processors incurs added complexity and performance implications. However if you're ingesting a stream of incoming data anyway, Storm may have some benefits.

  Essentially the framework of choice is to pick the right tool for the job, any one solution is always going to have its strengths.



* **Eli Collins - Crunch**

  Crunch (and FlumeJava) is pretty minimal compared to alternatives for writing MR pipelines. ie other frameworks do more, but if you just want to develop MR pipelines Crunch is great. Dataflow is very promising in terms of future direction.


* **Andrew Walkingshaw - Pig**

  So, why not Hive? Hive's biggest virtue is that it's almost SQL -- and Hive's biggest issue is that it's almost SQL. For interactive work, the Hive DDL is, in my experience, in the way. The Hive metadata model does scale much better to data-warehouse type workloads, though.

  As to Scalding and Cascalog, they're Scala and Clojure, and both those languages have REPLs. So they sound like good options – but, although I'm a little embarrassed to admit this, I haven't gotten round to doing much with Scala or Clojure yet! Furthermore, introducing new languages into a project or a company does come with a cost; Java's unfashionable, but everyone can at least read it, and that's a real virtue; Pig UDFs tend to be short, anyway, so Java is pretty workable.


## What is your favorite framework?

Do you agree with the choices above? Do you have your own favorite framework you think is being overlooked? I'd love to hear from you in the comments.

If there are some particularly good responses I'll add them to this post.



[1]:http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]:http://blog.cloudera.com/blog/2015/02/data-processing-with-apache-crunch-at-spotify/
[3]:http://www.scala-lang.org/