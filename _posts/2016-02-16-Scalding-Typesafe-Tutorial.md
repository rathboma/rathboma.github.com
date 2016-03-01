---
title: "Real World Hadoop - Implementing a left outer join in Scalding Using Type Safe API"
layout: post
description: Data processing pipelines with Scalding
topic: engineering
author: matthew_rathbone
published: false
coauthor: 
  name: Elena Akhmatova
  link: "https://ru.linkedin.com/pub/elena-akhmatova/3/877/266"
categories: 
  - hadoop
tags: 
  - hadoop
  - Scala
  - Scalding
---



> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
  
This article is my second covering Scalding and should be read together with the [previous Scalding article on the 'fields' API][18]. 

I'll talk through the differences in Scalding APIs, so some prior knowledge of Scalding is assumed. It might also be useful to refer to my [Cascading tutorial][17] as Scalding is built on [Cascading][2] and I make a few comparisons.

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Type Safe Scalding Solution

[Scalding][1] is a Scala API developed at Twitter for distributed data programming that uses the [Cascading Java API][2], which in turn sits on top of Hadoop's Java MapReduce API. There are several types of API for Scalding: [The Type Safe API][12], [Fields based API][11], and [Matrix API][16]. In my [previous Scalding article][18] I present the solution using the field-based API. This time we solve the same problem using Type Safe API and look at the core difference between the solutions.

In general, the type-safe API is the most popular version available as it allows use of scala features like case classes and tuples without too many changes.

## Demonstration Data

The tables that will be used for demonstration are called `users` and `transactions`. 

```bash
cat users
1	matthew@test.com	EN	US
2	matthew@test2.com	EN	GB
3	matthew@test3.com	FR	FR
```

and

```bash
cat transactions
1	1	1	300	a jumper
2	1	2	300	a jumper
3	1	2	300	a jumper
4	2	3	100	a rubber chicken
5	1	3	300	a jumper
```

Our code will read and write data from/to HDFS. Before starting work with the code we have to copy the input data to HDFS. Unlike Cascading (and MapReduce in general), Scalding wants the output directory to be created prior to executing the job.

{% highlight bash %}
hdfs dfs -mkdir input1
hdfs dfs -mkdir input2
hdfs dfs -mkdir output

hdfs dfs -put ./users.txt input1
hdfs dfs -put ./transactions.txt input2
{% endhighlight %}

## Code

All code and data used in this post can be found in my [Hadoop examples GitHub repository][github].

```scala

case class Transaction(id: Long, productId: Long, userId: Long, purchaseAmount: Double, itemDescription: String)
case class User(id: Long, email: String, language: String, location: String)

class Main (args: Args) extends Job(args) {

  val output = args( "output" )
  
  val input1 : TypedPipe[String] = TypedPipe.from(TextLine(args( "input1" )))
  val input2 : TypedPipe[String] = TypedPipe.from(TextLine(args( "input2" )))
  

  val usersInput : TypedPipe[User] = input1.map{ s: String =>
    val split = s.split("\t")
    User(split(0).toLong, split(1), split(2), split(3))
  }

  val transactionsInput : TypedPipe[Transaction] = input2.map{ s:String =>
    val split = s.split("\t")
    Transaction(split(0).toLong, split(1).toLong, split(2).toLong, split(3).toDouble, split(4))
  }

  val group1 = usersInput.groupBy(_.id)
  val group2 = transactionsInput.groupBy(_.userId)
  
  val joinedBranch =  group2
    .leftJoin(group1) // 'user_id -> 'id, 
    .map{ case (k: Long, (t: Transaction, Some(u: User))) => (t.productId, u.location) }
    .distinct
    .groupBy{ case (productId, location) => productId }
    .size
    .write(TypedTsv[(Long, Long)](output))
}
```

I've defined two [case classes](http://docs.scala-lang.org/tutorials/tour/case-classes.html) (`User` and `Transaction`) to represent the records in each dataset. You can see immediately that the fields of the classes have types specified, and do not include any Scalding specific special code.

```scala
case class Transaction(id: Long, productId: Long, userId: Long, purchaseAmount: Double, itemDescription: String)
case class User(id: Long, email: String, language: String, location: String)
```

Unfortunately, our data is stored in a delimited format, so to start working with it, we need to convert it to the right types:

```scala
  val usersInput : TypedPipe[User] = input1.map{ s: String =>
    val split = s.split("\t")
    User(split(0).toLong, split(1), split(2), split(3))
  }

  val transactionsInput : TypedPipe[Transaction] = input2.map{ s:String =>
    val split = s.split("\t")
    Transaction(split(0).toLong, split(1).toLong, split(2).toLong, split(3).toDouble, split(4))
  }
```
We can then operate on the data by transforming collections of `User` and `Transaction` objects. While the solution is almost identical to my [field API solution][18], this version looks much more like 'regular scala'.

Some differences to regular Scala are worth noting -- calling `size` after `groupBy` actually counts the list of values in each group, rather than counting the size of the group list itself. This is a little unintuitive as it is very different behavior compared to vanilla Scala.

```scala
  val joinedBranch =  group2
    .leftJoin(group1) // 'user_id -> 'id, 
    .map{ case (k: Long, (t: Transaction, Some(u: User))) => (t.productId, u.location) }
    .distinct
    .groupBy{ case (productId, location) => productId }
    .size
    .write(TypedTsv[(Long, Long)](output))
```

## Running the resulting jar

```bash
hadoop jar scala-scalding-1.0-SNAPSHOT-jar-with-dependencies.jar com.twitter.scalding.Tool main.scala.Main --hdfs --input1 input1 --input2 input2 --output output

hdfs dfs -copyToLocal output/part-00000 .
cat part-00000 
1	3
2	1
```

## Testing

Testing is similar to that of the Field based solution. The main difference can be seen in the line

```scala
sink[(Long, Long)]
```

The field based API decided itself that our ids are Integers, but in the type-safe solution we defined this up front.

```scala
class MainTypedFunctionJoinText extends WordSpec with Matchers{
  "Our job" should {
    JobTest(new main.scala.com.matthewrathbone.scalding.Main(_))
      .arg("input1", "usersInput")
      .arg("input2", "transactionsInput")
      .arg("output", "outputFile")
      .source(TextLine("usersInput"), List((0, "1	matthew@test.com	EN	US"), (1, "2	matthew@test2.com	EN	GB"), (2, "3	matthew@test3.com	FR	FR")))
      .source(TextLine("transactionsInput"), List((0, "1	1	1	300	a jumper"), (1, "2	1	2	300	a jumper"), (2, "3	1	2	300	a jumper"), (3, "4	2	3	100	a rubber chicken"), (4, "5	1	3	300	a jumper")))
      .sink[(Long, Long)](TypedTsv[(Long, Long)]("outputFile")){buff =>
        val outMap = buff.toMap
      	"output should contain 2 lines " in {
        	buff.length should be (2)
        }
        "values are " in {
        	outMap(1) shouldBe 3
            outMap(2) shouldBe 1
      	}
      }
      .run
      .finish
  }
}
```

## Differences between the Scalding APIs and their roots

There are three APIs for Scalding: [Fields based API][11], [Type Safe API][12], and [Matrix API][16]. Their introduction order is the order they are mentioned here. So the Matrix API is the newest.

One potential problem we might have using the Field API is that fields are not strongly typed, and must be infered at compile time. We name the fields, but we're not defining our data structures in quite the same way we do in the typed API.

One reason for having different Scalding APIs is it's close ties to Cascading. Scalding runs on top of Cascading so no only inherits a lot of it's ideas, but develops alongside the Java framework.

This is evident when using the field-based API of Scalding. We can see it's close resemblence to regular cascading.

For example, here is how we define the schema for a particular dataset in each:

```scala
// SCALDING

val users = ( 'id, 'email, 'language, 'location)
val transactions = ( 'transaction_id, 'product_id, 'user_id, 'purchase_amount, 'item_description)
```

vs


```java
// CASCADING

Fields users = new Fields( "id", "email", "language", "location" );

Fields transactions = new Fields( "transaction-id", "product-id", "user-id", "purchase-amount", "item-description" );
```
Data parsing also looks similar, although Scalding relies on a functional approach compared to Cascading's object oriented ideas:

```scala
// SCALDING

val usersInput = input1.read.mapTo( inputFields -> users ) { te: TupleEntry =>
      val split = te.getString( "line" ).split("\t");
      (split( 0 ), split( 1 ), split( 2 ), split( 3 ))
}

val transactionsInput = input2.read.mapTo( inputFields -> transactions ) { te: TupleEntry =>
      val split = te.getString( "line" ).split("\t");
      (split( 0 ), split( 1 ), split( 2 ), split( 3 ), split( 4 ))
}
```
vs

```java
// CASCADING

Tap usersTap = new Hfs( new TextDelimited( users, false, "\t" ), usersPath );
      
Tap transactionsTap = new Hfs( new TextDelimited( transactions, false, "\t" ), transactionsPath );
```

Neither solution is type safe. If we look at Cascading's documentation for [TextDelimited][13] class:

> ..if a field cannot be coerced into an expected type, a null will be used for the value.

But Cascading has another structure - a Tuple. See [Tuple][15] and [TupleEntry][14].

> Tuples work in tandem with Fields and the TupleEntry classes. A TupleEntry holds an instance of Fields and a Tuple. It allows a tuple to be accessed by its field names, and will help maintain consistent types if any are given on the Fields instance.

which more closely resembles Scalding's typed system, which is sometimes referred to as *tuple-based*

## Thoughts

As in my prior Scalding walkthrough the main code and the test code are really concise. The newer API does not make the code heavier, but rather makes it feel more like 'regular Scala'. While either the typed or field based APIs are both totally usable, I would definitely choose Type Safe API for more complex tasks due to it's compile-time safety and more native-scala feel.

In many ways the Typed API feels pretty similar to [Spark](http://blog.matthewrathbone.com/2015/12/14/spark-tutorial.html), which is a good thing.

## Scalding Resources 

The [Cascading web-site][2] has resources related to both Cascading and Scalding.

Book: 

* PACKT Publishing *Programming MapReduce with Scalding: A practical guide to designing, testing, and implementing complex MapReduce applications in Scala*, available from [Amazon][10].


[1]: https://github.com/twitter/scalding
[2]: http://www.cascading.org
[3]: https://github.com/twitter/scalding/tree/master/scalding-core/src/test/scala/com/twitter/scalding
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[5]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop---implementing-a-left-outer-join-in-java-with-cascading.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[10]: http://amzn.to/1QJxKsh
[11]: https://github.com/twitter/scalding/wiki/Fields-based-API-Reference
[12]: https://github.com/twitter/scalding/wiki/Type-safe-api-reference
[13]: http://docs.cascading.org/cascading/2.0/javadoc/cascading/scheme/hadoop/TextDelimited.html
[14]: http://docs.cascading.org/cascading/2.2/javadoc/cascading/tuple/TupleEntry.html
[15]: http://docs.cascading.org/cascading/2.2/javadoc/cascading/tuple/Tuple.html
[16]: https://github.com/twitter/scalding/wiki/Matrix-API-Reference
[17]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop-implementing-a-left-outer-join-in-java-with-cascading.html
[18]: http://blog.matthewrathbone.com/2015/10/20/scalding-tutorial.html
