---
title: Hadoop MapReduce Scoobi Tutorial with Examples
layout: post
description: "How to use Scala & Scoobi to perform a left outer join. Includes a comparision with Hive, Pig, and Java Mapreduce"
subject: hadoop
tags: 
  - scoobi
published: true
---


This article is part of [my guide to map reduce frameworks][1] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.

This time I'm using [Scoobi][2].

## The Problem

Let me quickly restate the problem from [my original article][3].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][4], [with hive][5] and [with pig][6]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Scoobi Solution

For the impatient, you can [see the full implementation here][7].

Scoobi is a framework that allows you to write workflows in Scala using functional constructs that are designed to feel like regular list, map, and set operations.

Fundamentally the framework provides you with *distributed lists* that you transform and aggregate much like you would a regular list in scala.

For example, a simple map-only job in scoobi might look something like this:

{% highlight scala %}

// maybe a user looks like
// firstname,lastname,age
val users = TextInput.fromTextFile(inputDirectory)
val transformed = users.map{user =>
	user.split(",")(2).toInt * 100
}

persist(toTextFile(transformed, outputDirectory))

{% endhighlight %}

It really doesn't look like Map Reduce *at all*. In fact, Scoobi has to do a lot of complicated stuff under the hood to enable this kind of syntax (such as code generation).

The final scoobi solution tops out at ~50 lines of code, which is a 10x improvement over the Java mapreduce 500 lines of code. This is largely thanks to Scoobi's built in `join` syntax that lets us join two datasets together without having to worry about partitioners, groupers, or sorters.

As a demonstration, here is a simplified version of a left outer join in scoobi (I've ripped this straight from my code):

{% highlight scala %}

case class User(id: Int, email: String, lang: String, location: String)
case class Transaction(id: Int, productId: Int, userId: Int, itemDescription: String)

val users: DList[User] = loadUsers()
val transactions: DList[Transaction] = loadTransactions()

val usersByUserId = users.map{user => (user.id, user)}
val transactionsByUserId = transactions.map{t => (t.userId, t)}

val relation = Relational(transactionsByUserId)

val joined: DList[(Int, (Transaction, Option[User]))] = relation.joinLeft(usersByUserId)

{% endhighlight %}

Oh yeah, you can also work with case classes, which is super nice.

### Lets get on with it

So the basic workflow of this algorithm is scoobi is this:

1. Read users and transactions
2. Join users to transactions based on userid
3. transform this dataset to be (productid, location) K/V pairs
4. Group by product id to get (productid, Iterable\[location\])
5. find the distinct number of locations for each product
6. write (productid, distinct-locations) to the output directory somewhere

Here's the code I used to accomplish this:

{% highlight scala %}

object Example extends ScoobiApp {

  case class User(id: Int, email: String, lang: String, location: String)
  case class Transaction(id: Int, productId: Int, userId: Int, itemDescription: String)

  def run() {
    val u = args(0)
    val t = args(1)
    val out = args(2)

    implicit val tformat = WireFormat.mkCaseWireFormat(Transaction, Transaction.unapply _)
    implicit val uformat = WireFormat.mkCaseWireFormat(User, User.unapply _)

    // 1. Read users and transactions (and part of 2, we're setting the key to userid)
    val users: DList[(Int, User)] = TextInput.fromTextFile(u).map{ line =>
      val split = line.split("\t")

      (split(0).toInt, User(split(0).toInt, split(1), split(2), split(3)))
    }
    val transactions: DList[(Int, Transaction)] = TextInput.fromTextFile(t).map { line =>
      val split = line.split("\t")
      (split(2).toInt, Transaction(split(0).toInt, split(1).toInt, split(2).toInt, split(3)))
    }

    // 2. join users to transactions based on userid
    val relation = Relational(transactions)

    val joined: DList[(Int, (Transaction, Option[User]))] = relation.joinLeft(users)

    // 3. transform so we have a Dlist of (productid, Option[location])
    // 4. group by key to get (productid, Iterable[location])
    val grouped: DList[(Int, Iterable[Option[String]])] = joined.map{ case(key: Int, (t: Transaction, oU: Option[User])) =>
      (t.productId, oU.map(_.location))
    }.groupByKey

    // 5. find the distinct number of locations for each product. This step was hard to work out.
    val flattened: DList[(Int, Iterable[Long])] = grouped.map{ case(product: Int, locations: Iterable[Option[String]]) => 
      var last: Option[String] = None
      // this works becase we know the values are sorted.
      val distinctValues = locations.map{l =>
        val result = (last, l) match {
          case (Some(a), Some(b)) if (a == b) => 0l
          case (_, Some(b)) => 1l
          case other => 0
        }
        last = l
        result
      }      
      (product, distinctValues)
    }
    val result = flattened.combine(Sum.long)
    // write to the output directoryp
    persist(toTextFile(result, out))
  }
}
{% endhighlight %}

Pretty neat huh?

This is also fully unit-tested. Check out my code for the full test suite.

## Thoughts

The final program is pretty succint and Scoobi makes it feel like you're writing regular Scala. In itself these are excellent attributes of a Scala framework, but unfortunately they come with a cost.

Fundamentally if something doesn't go quite right and you need to debug or optimize your code you're going to be in a bad place. 

Generated code means that stack traces from map/reduce tasks are not going to be very helpful, and operations in scoobi might do something different in practice than you imagined ("it looks like this should be a reduce task, but it'd doing something different").

Secondly, something that may seem pretty simple on the surface (count distinct locations) can end up being complicated to implement in practice, not because the final solution is hard, but rather because the API is so very removed from `map, partition, group, sort, and reduce` that you're forced to do things differently. It also doesn't help that there are [multiple ways][7] [to solve the same problem][8].

### The Right Framework?

The Scoobi community can be [really helpful and responsive][8], but Scoobi only supports Scala 2.10+, and APIs change regularly from release to release, breaking old code to introduce new hot features. 

Scoobi is also not the only Scala framework in town, a popular alternative, [Scalding][9], is based on a mature java framework ([cascading][10]), is published by Twitter, and has a large and active community.

Personally, I like the api for Scoobi a lot, but with the number of folks involved in the Scalding community it's quickly becoming the framework to beat.


## Wrapping Up

Scoobi comes somewhere inbetween Pig and Java in terms of ease of use. If you're interested in how it compares to other frameworks, check out my [guide to mapreduce frameworks][1] for the links.



[1]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]: https://github.com/nicta/scoobi
[3]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[4]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[5]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[6]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[7]: https://github.com/rathboma/hadoop-framework-examples/blob/master/scoobi/src/main/scala/com/matthewrathbone/example/Example.scala
[8]: https://groups.google.com/forum/#!topic/scoobi-users/qAMxek-rMw4
[9]: https://github.com/twitter/scalding
[10]: http://www.cascading.org/
