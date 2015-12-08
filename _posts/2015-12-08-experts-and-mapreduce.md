---
title: 5 Industry Veterens Pick Their Favorite MapReduce Frameworks
date: 2015-12-08
subject: hadoop
layout: post
published: false
image:
  url: /img/elephant.jpg
  author:
    url: https://www.flickr.com/photos/rabanito/3416817267
    name: Senorhorst Jahnsen
---


Over the last 2 years I've published [numberous MapReduce framework guides][1], but I've given no real direction on **which** framework to use and why.

If you're just getting started with Hadoop and MapReduce I know figuring out where to start can be very overwhelming, so getting direction is important!

I figured instead of flapping my own opinions (which are outdated honestly), I'd reach out to folks who are writing production code every day and ask them what they use. So here we go.

## Questions

1. Which MapReduce Framework do you prefer to work in?
2. Why do you like using it vs regular MapReduce?
3. Why do you like using it vs other MapReduce frameworks?

Note that opinions expressed by those interviewed are personal and do not nessecerily represent employer opinions.

## Joe Stein, CEO of Elodina

As well as running Elodina, Joe runs [All Things Hadoop](http://allthingshadoop.com/), and talks about distributed computing at a range of conferences and events.

* Which MapReduce Framework do you prefer to work in?

  > Scalding

* Why do you like using it vs regular MapReduce

  > It is easy to reason about composing data together when the language is composing functions around the data.

* Why do you like using it vs other frameworks?

  > After Scalding I would skip over them all and go straight to Python streaming as my next default.

## Sam Wang, Engineering Manager at Foursquare

When I worked at Foursquare I would constantly drag Sam into Hadoop infrastructure projects becuase he was so good at them, even though he was meant to be working on machine learning.

* Which MapReduce Framework do you prefer to work in?

  > Scalding

* Why do you like using it vs regular MapReduce

  > Implementing intuitive joins with Scala types in Scalding is very easy, and is probably the number one feature that our engineers love over writing in any other framework.
  > 
  > 
  > In our ecosystem, writing joins in native MR always required writing throw-away container types for joins in Thrift, which added an unnecessary layer of complexity to a task. Also, implementing any of the join primitives in Scalding in MR (outerJoin, hashJoin, etc.) is very cumbersome in vanilla MR, and usually resulted in code that was not reusable from task to task.
  > 
  > Being able to depend on the native Scalding serialization for Scala types is also convenient, as users don't have to think too hard about how data flows over a wire, and how to serialize and deserialize their complex types. Finally, there's just less boilerplate code in general, and the code is much more readable to anyone skimming a flow to figure out exactly what the salient bits of it are.

* Why do you like using it vs other frameworks?

  > Foursquare arrived at Scalding via an organic process, which was partially technical, and partially cultural. We had previously invested in a framework called Scoobi, but we wanted to switch to a framework with a richer ecosystem of developers and support.
  > 
  > The Scalding API looks similar to writing Scoobi, so the switch was not as dramatic as if we had switched to something that looked completely different. We had already invested a lot in tuning our cluster to run MR version 1 jobs, and the appeal of Scalding working out of the box on our existing infrastructure was the other major deciding factor in why we chose it.
  > 
  > Scalding, at the time, seemed like the best way to mix our existing codebase with more Scala-idiomatic join primitives and classes.


## David Leifker, Software Architect at Spreadfast

* Which MapReduce Framework do you prefer to work in?

  > Spark

* Why do you like using it vs regular MapReduce?

  > Simply put Spark is better able to execute iterative operations faster then M/R. This is readily apparent for ML applications. Currently there is MLlib for Spark, but Mahout is also shifting to use Spark for this reason. The ability to cache, or pin, RDDs in memory also helps to speed up certain operations.


* Why do you like using it vs other frameworks?

  > Honestly, it was a natural fit for the type of problems I was looking to solve, those being oriented around ML. If you are looking to perform non-iterative batch processing that cannot fit in the distributed memory of your cluster, M/R is still the likely winner.
  > 
  > Spark compared to say Storm is a question of is it easier to move your data or read it in place. It depends on where the data is. If the bulk of the data is already collected and stored in the cluster, its easier to reason about moving processing to the where the data is stored, potentially changing how its distributed. Compare that to moving already written data through a topology of processors incurs added complexity and performance implications. However if you're ingesting a stream of incoming data anyway, Storm may have some benefits.
  > 
  > Essentially the framework of choice is to pick the right tool for the job, any one solution is always going to have its strengths.


## Eli Collins, Chief Technologist at Cloudera

* Which MapReduce Framework do you prefer to work in?

  > Crunch

* Why do you like using it vs regular MapReduce?

  >  It's easier to develop and debug _pipelines_ than stitching together individual MR jobs

* Why do you like using it vs other frameworks?

  > Crunch (and FlumeJava) is pretty minimal compared to alternatives for writing MR pipelines. ie other frameworks do more, but if you just want to develop MR pipelines Crunch is great. Dataflow is very promising in terms of future direction.
  > 
  > [Here's a recent piece on crunch from the Cloudera blog][2].


## Andrew Walkingshaw, Senior Software Engineer at Jaunt VR

* Which MapReduce Framework do you prefer to work in?

* Why do you like using it vs regular MapReduce?

* Why do you like using it vs other frameworks?


## What framework do you use?

Which framework do you use and why? Would you recommend it for a beginner? Leave your answers in the comments below.


## Wrap up

Clearly my network has a bias towards [Scala][3] frameworks, maybe because the functional nature of the language makes it easy to reason about MapReduce behavior.

Spark in particular (while not actually a MapReduce framework per-se) takes this idea a step further by making operations look like native scala list operations, which can be very powerful.

One thing everyone agrees upon -- joining data in regular MapReduce is painful, and best avoided. All of these frameworks make data joins a lot more straightforward, and in some cases only a single line of code.

For those who are working with Scala, Scalding and Spark are clearly fan favorites, so that's probably a good place to start. If you don't know Scala, maybe now is a good time to start playing with it. :-).




[1]:http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]:http://blog.cloudera.com/blog/2015/02/data-processing-with-apache-crunch-at-spotify/
[3]:http://www.scala-lang.org/