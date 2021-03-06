---
title: A Quick Guide to Concurrency in Scala
layout: post
description: I'll talk through the basics of Threads, Akka, Futures, and Timers in this quick overview of concurrency for Scala. Great for those building apps in Scala.
subject: "scala"
tags:
- scala
- concurrency
- threading
- futures
- programming
image:
  url: /img/blog/multi-threading.jpg
  author:
    name: Brian Snelson
    url: https://www.flickr.com/photos/exfordy/3338740224
---

Scala is a programming language that runs on the Java Virtual Machine (JVM). As such it has full access to the JVM's multi-threading capabilities.

Unlike Java, Scala is not limited by default to Threads for concurrency (although they are still an option), but there are a range of useful ways to do things in the background.

## Why Concurrency is Awesome with Scala

[Scala](https://www.scala-lang.org/) is a functional programming language that aims to avoid [*side effects*](http://softwareengineering.stackexchange.com/questions/40297/what-is-a-side-effect) by encouraging you to use both immutable data structures, and values rather than variables.

So by default when you build a `List`, `Map`, or `Case Class` in Scala it is immutable and cannot be changed (you can of course use mutable versions of these classes, or make your class values into variables). Likewise, if you use `val` instead of `var`, no re-assignment is possible.

Immutability might seem unrelated to threading, but think about a thread which has been given a list of strings to process, perhaps each string is a website that needs crawling.

In the Java model, this list might be updated by other threads at the same time (adding / removing websites), so you need to make sure you either have a thread-safe list, or you safeguard access to it with the `protected` keyword or a Mutex.

By default in Scala this list is immutable, so you can be sure that the list cannot be modified by other threads, because it cannot be modified at all.

While this does force you to program in different ways to work around the immutability, it does have the tremendous effect of simplifying thread-safety concerns. The value of this cannot be understated, it's a huge burden to worry about thread safety all the time, but in Scala much of that burden goes away.


## Concurrency Options for Scala

Alright, I mentioned that using a `Thread` is only one of several options, so let me go through the main ones briefly. I'll talk about Futures, Actors, and Threads. I'll drop some extra props to Timers too.

## Futures

Think of a [Scala Future](http://docs.scala-lang.org/overviews/core/futures.html) as a simple way of saying *do this thing in the background*. You can start the execution of a future pretty simply like this:

{% highlight scala %}

  val future = Future {
    val result = someLongRunningThing()
    result
  }


{% endhighlight %}

In this example Scala will compute the value of `result` in a separate thread, so the value of `future` will resolve immidiately. It will not block on the completion of the Future itself.

Simple right? Well that's not all that a Future does.

### Future Transforms

Like many functional languages, Scala loves making things work like a list or collection of objects. You've probably seen this before with the [`Option` class](http://www.scala-lang.org/api/2.12.x/scala/Option.html), which behaves mostly like a single element list.

Well a `Future` is no different. You can iterate over the result of a future and process it's results. This will also happen in a background thread.

I know this sounds confusing, but here is an example:

{% highlight scala %}

val future = Future{
  val result = someLongRunningThing()
  result
}

future.map{ result =>
  Database.save(result)
}


{% endhighlight %}

Like with a list we can map, filter, flatMap, and iterate over a Future to transform it's result into another future. In this example a background thread will compute result, then when it completes another background thread will save it to the database.

We can chain several of these together like this:

{% highlight scala %}
val productsFuture =  Future{
    getUser()
  }.map{ user =>
    Database.save(user)
  }.map { dbResponse =>
    Products.get(dbResponse.user.id)
  }

{% endhighlight %}

There are many other operators of varying complexity, but they are beyond the scope of this article.

### Future Completion State

Scala provides some callbacks that you can use at the end of a future (or chain of futures). You can perform different functions after both failed and successful executions. Again these operations also happen in a background thread.

{% highlight scala %}

  val future = Future {
    getUser()
  }

  future.onComplete {
    case Success(user) => println("yay!")
    case Failure(exception) => println("On no!")
  }


{% endhighlight %}

There are also `onSuccess` and `onFailure` callbacks for convenience.

## Akka

The second concurrency option for Scala is **Akka**. Akka gets a lot of press from [Lightbend](https://www.lightbend.com/) as part of the marketing for their 'reactive' software stack.

Akka is Scala's implementation of an [**Actor** concurrency model](https://en.wikipedia.org/wiki/Actor_model) made popular in part by Erlang. To use Akka, you define a set of workers (Actors) that listen for messages in a mailbox and act on them in some way.

While a `Future` is about running a single piece of code in the background, Akka is more suitable for setting up a more robust background job processing framework.

To start a job in the background with Akka you simply send it to an actor and go along your merry way, leaving it to Akka to figure out where and how the message gets processed.

In practice a simple example looks something like this:

{% highlight scala %}

// Actor
class Worker extends Actor {


  def receive = {
    case UserJob(user, purchases) =>
      processPurchases(user, purchases)
  }
}


// Producer
val actor = getActor() // you probably define this somewhere else
actor ! UserJob(currentUser, getPurchases(currentUser))


{% endhighlight %}

You can even have an actor return a value to the sender wrapped in a future, although this functionality does *not* work in distributed mode.


{% highlight scala %}

// Actor

class Worker extends Actor {


  def receive = {
    case UserJob(user, purchases) =>
      sender ! processPurchases(user, purchases)
  }
}


// Producer
val resultFuture = actor ? UserJob(currentUser, purchases)
result.map{ result =>
  println(result.toString())
}


{% endhighlight %}

### Clustered Akka

Uniquely, Akka can also be set up as a distributed system, where actors can run across any number of machines, not just within your local JVM. This means message passing happens over a remote RPC call rather than an internal function call, but the complexity is entirely handled by the Akka runtime, so your code can stay the same (which is great).

The ability to distribute computation across a cluster of machines is one of the main benefits of Akka, although it does come with a learning curve.

In theory Akka allows you to scale your system easily to multiple machines as your needs grow. However setting up Akka as a distributed system is fiddly and complicated, but it is used in production at a number of high profile technology companies, so once set-up it can be stable and powerful. It is also supported by the excellent [Lightbend](https://www.lightbend.com/).

Try Googling [Akka Monitoring](https://www.google.com/search?q=akka+monitoring) to see how a lot of the core infrastructure for managing a cluster of Akka machines is still very early in development (unless you pay for a premium product).

Akka is a great way to compartmentalize your code and organize workers into functional clusters, but for quick background jobs (like calling an API and storing the results), Futures are definitely quicker and easier to use.


## Java Threads and Thread Pools

There are times when falling back to regular old Java threads is the best strategy to concurrency. I've used the `Thread` class many times in Scala myself, mostly for instances where I want explicit control over the execution and management of my code. For example if you're making a time intensive connection to a third party system and want to keep the connection open for multiple jobs rather than establishing it fresh every time you need to do something.

To use threads in Java and Scala you can implement your own class and run it as a thread directly.


{% highlight scala %}

// this is terrible code and you should not use it in production
class OrderProcessor extends Thread {
  override def run() {
    // runs forever
    while(true) {
      val orders = Orders.getOrders()
      orders.foreach{ order =>
        process(order)
      }
    }
  }
}

val thread = new OrderProcessor()
thread.start()
// waits for the thread to finish
thread.join()

{% endhighlight %}


Much of the time it's not worth interacting with `Thread` directly, but rather submitting `Runnable` classes to a thread pool for processing. A thread pool gives you a *pool* of threads that can be re-used to process multiple background jobs without having to create a new thread every time.

A `Runnable` is a simple class with a `run` method. Here's a simple example:


{% highlight scala %}

class OrderProcessorRunnable(order: Order) extends Runnable {

  override def run() {
    order.process() // runs a long time
    order.save()
    order.user.save()
  }

}


val pool = Executors.newFixedThreadPool(2) // 2 threads
pool.submit(new OrderProcessorRunable(new Order()))

{% endhighlight %}

A `Runnable` cannot return a value, but there are also `Callable` objects which can. With Callables you can effectively replicate the behavior of Scala futures, but if you look at some [Callable examples](http://www.vogella.com/tutorials/JavaConcurrency/article.html#futures-and-callables) you'll notice how much more boiler plate code is required. Now imagine chaining a bunch of these together.


### Other Cool Java Stuff

Of course being on the JVM gives you access to other cool background processing constructs like the [Timer](https://docs.oracle.com/javase/7/docs/api/java/util/Timer.html), which gives you the ability to run a job in the background on a regular basis, or after a particular amount of time has passed. Again, this uses Java primatives, but is very useful non the less.

Here's a [great guide to Java concurrency](http://www.vogella.com/tutorials/JavaConcurrency/article.html) if you want to learn more and go more in-depth.


## Stream Processing

The guide so far has really been focused on concurrency scenarios where you have an action to perform and you need to figure out a way to perform it in the background.

Another abstraction for concurrency is to think of actions as events in a stream that need continual, real-time processing.

For example you may want to process a stream of database changes, or click events from a website.

The Akka project also incorporates a system called **Akka Streams** which is built on the Actor system, but who's API is firmly about streams of data.

Typically in a stream processing pipeline you have several components:

- **Source** - where data comes from, think of it like a box that produces data, like a database, or stream of website clicks
- **Sink** - where data goes when it has been processed, like a database, log file, array, or whatever
- **Flow / Transformation node** - In Akka it's called a 'flow', in other systems it is called something different, basically a thing that filters or changes data elements, for example filtering all clicks from bots.

With Akka Streams you can join these together to make a workflow of actions to be taken to a stream of data, and all these actions will happen distributed across the Akka cluster.


Here's a quick example of Akka Streams in action (taken from [this excellent Stack Overflow walkthrough](http://stackoverflow.com/questions/35120082/how-to-get-started-with-akka-streams):


{% highlight scala %}

// source and sink definitions
val source = Source(1 to 3)
val sink = Sink.foreach[Int](println)

// flow transformations
val invert = Flow[Int].map(elem => elem * -1)
val doubler = Flow[Int].map(elem => elem * 2)

// join them all together
val runnable = source via invert via doubler to sink

// run them
runnable.run()
/*
OUTPUT:
-2
-4
-6
*/

{% endhighlight %}


### Use Sparingly

I've used stream processing frameworks in the past, and they're fantastic for a particular use case (we were processing web traffic, site clicks, and app interactions), speficially **real-time** data processing.

To be honest I see them as very different to the thread / future use case that is more common to the average Scala app, so just think about what you really need before jumping into a stream-based solution, as they come with a learning curve above and beyond typical threading problems.

I include them here for those interested in large-scale real-time data processing use cases.

### Other Stream processing frameworks

There are a bunch of stream processing frameworks available, and not all of them are Scala specific (although many are built with Scala, and support Scala first and foremost). They are all built on the assumption that work needs distributing across a number of machines, rather than simply executing on a separate thread.


- [Apache Samza](http://samza.apache.org/) - from the team that built [Kafka](https://kafka.apache.org/), one of my favorite infrastructure projects.
- [Apache Spark Streaming](http://spark.apache.org/streaming/) - part of the class-leading Spark project
- [Apache Storm](http://storm.apache.org/)


## Quick Shout-Out to Jesque

Aside from Scala and Java I also work a lot with Ruby (stick with me on this). Ruby is a single-threaded scripting language, and so the community built a set of alternative tools for performing 'background work'. One of the biggest frameworks in the Ruby landscape is [Resque](https://github.com/resque/resque), it's a simple job-queue backed by [Redis](https://redis.io/). Background jobs run in entirely different processes, and pull jobs from the Redis queue.

I found it to be an elegant system that made testing my background jobs easy and provided me with a sane project structure.

Luckily for us then that the system has been implemented in Java as [Jesque](https://github.com/gresrun/jesque), complete with a Java implementation of the web monitoring UI, and full compatibility with Resque's message protocols.

I have used Jesque and really like it as a simple way to deploy background jobs across multiple machines. It scales up well and is easy to reason about.

It is however more of a job queue and processing framework than a threading framework, but I like it so much I wanted to include it.

## Wrap Up

Hopefully you have a sense of the concurrency options available to you with Scala. While not a comprehensive guide, my goal was to provide a good starting point.

My personal opinion is that Futures are a great way of performing quick background tasks, but something more comprehensive like Akka or Jesque is more appropriate for building a manageable background-job processing stack.

I have a fondness for the simplicity of the Java Thread, and even with Scala you're going to be dealing with Thread Pools, Executors, and Runnables, so the humble `Thread` is not a terrible place to start playing around with concurrency.

