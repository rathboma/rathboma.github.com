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

I've defined two case classes (`User` and `Transaction`) to represent the records in each dataset. You can see immediately that the fields of the classes have types specified, and do not include any Scalding specific special features. Ids must now be of Type Long, and will not be read as Strings or Integers.

```scala
case class Transaction(id: Long, productId: Long, userId: Long, purchaseAmount: Double, itemDescription: String)
case class User(id: Long, email: String, language: String, location: String)
```

Unfortunately, our data is in a delimited format, so to start working with it, we need to convert it to the right types:

{% highlight scala %}
  val usersInput : TypedPipe[User] = input1.map{ s: String =>
    val split = s.split("\t")
    User(split(0).toLong, split(1), split(2), split(3))
  }

  val transactionsInput : TypedPipe[Transaction] = input2.map{ s:String =>
    val split = s.split("\t")
    Transaction(split(0).toLong, split(1).toLong, split(2).toLong, split(3).toDouble, split(4))
  }
{% endhighlight %}

We can then operate on the data by transforming collections of `User` and `Transaction` objects. While the solution is almost identical to my [field API solution][18], this version looks much more like 'regular scala'.

Some stuff is different, and worth noting -- calling `size` after `groupBy` actually counts the list of values, rather than counting how many groups there are overall. This is a little unintuitive with the API closely resembling vanilla scala in all other ways.

{% highlight scala %}
  val joinedBranch =  group2
    .leftJoin(group1) // 'user_id -> 'id, 
    .map{ case (k: Long, (t: Transaction, Some(u: User))) => (t.productId, u.location) }
    .distinct
    .groupBy{ case (productId, location) => productId }
    .size
    .write(TypedTsv[(Long, Long)](output))
{% endhighlight %}

## Running the resulting jar

{% highlight bash %}
hadoop jar scala-scalding-1.0-SNAPSHOT-jar-with-dependencies.jar com.twitter.scalding.Tool main.scala.Main --hdfs --input1 input1 --input2 input2 --output output

hdfs dfs -copyToLocal output/part-00000 .
cat part-00000 
1	3
2	1

{% endhighlight%}
 
## Testing

Test again is similar to that of the Field based solution. The main difference can be seen in the line
{% highlight scala %}
sink[(Long, Long)]
{% endhighlight%}

Field based API decided that our ids are Integers. Type safe API did not leave space for "deciding". It was specified from the very beginning that the ids are of type Long.

{% highlight scala %}
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
{% endhighlight %}

## Differences between APIs and their roots

There are three APIs for Scalding: [Fields based API][11], [Type Safe API][12], and [Matrix API][16]. Their names talk for themselves. And, chronologically, they have appeared exactly in the order they are mentioned here. First Fields based API came to existence, then Type Safe API and the latest one is the Matrix API. 

The problem with Field based API is the type inference at compile time. As Fields based API allows to name the fields but the type of the fields is not specified different latent problems might emerge during runtime.

To source of the multitude of the APIs lays is the underlying fact that Scalding is based on Cascading. Hence Scalding inherits a lot from Cascading and develops together with it. 

Before (when using Fileds Based API) we directly specified the schema of fields we expected:
{% highlight scala %}
val users = ( 'id, 'email, 'language, 'location)
val transactions = ( 'transaction_id, 'product_id, 'user_id, 'purchase_amount, 'item_description)
{% endhighlight %}

and parsed the input data:
{% highlight scala %}
val usersInput = input1.read.mapTo( inputFields -> users ) { te: TupleEntry =>
      val split = te.getString( "line" ).split("\t");
      (split( 0 ), split( 1 ), split( 2 ), split( 3 ))
}

val transactionsInput = input2.read.mapTo( inputFields -> transactions ) { te: TupleEntry =>
      val split = te.getString( "line" ).split("\t");
      (split( 0 ), split( 1 ), split( 2 ), split( 3 ), split( 4 ))
}
{% endhighlight %}

Lets look at the similar code in Cascading (from my [article on Cascading][17]):

{% highlight scala %}
Fields users = new Fields( "id", "email", "language", "location" );
Tap usersTap = new Hfs( new TextDelimited( users, false, "\t" ), usersPath );
      
Fields transactions = new Fields( "transaction-id", "product-id", "user-id", "purchase-amount", "item-description" );
Tap transactionsTap = new Hfs( new TextDelimited( transactions, false, "\t" ), transactionsPath );
{% endhighlight %}

Both solutions are not really type safe. If we look at Cascading's documentation for [TextDelimited][13] class:

"Safe meaning if a field cannot be coerced into an expected type, a null will be used for the value." 

But Cascading has another structure - a Tuple. See [Tuple][15] and [TupleEntry][14].

"Tuples work in tandem with Fields and the TupleEntry classes. A TupleEntry holds an instance of Fields and a Tuple. It allows a tuple to be accessed by its field names, and will help maintain consistent types if any are given on the Fields instance."

That is why Type Safe API for Scalding is often called "tuple-based".


## Thoughts

As before the main code and the test code are really concise and self-explanatory. Newer API does not make the code heavier, less readable, or hard to comprehend. Perhaps it does not really matter which API to choose for smaller tasks where it is easy to detect a type issue. I would definitely choose Type Safe API for more complex tasks though.

## Scalding Resources 

[Cascading web-site][2] has resources related to both Cascading and Scalding.

## Further Reading

PACKT Publishing ‘Programming MapReduce with Scalding: A practical guide to designing, testing, and implementing complex MapReduce applications in Scala’ Book

by Antonios Chalkiopoulos: from [Amazon][10].


[1]: https://github.com/twitter/scalding
[2]: http://www.cascading.org
[3]: https://github.com/twitter/scalding/tree/master/scalding-core/src/test/scala/com/twitter/scalding
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[5]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop---implementing-a-left-outer-join-in-java-with-cascading.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[10]: http://www.amazon.com/Programming-MapReduce-Scalding-Antonios-Chalkiopoulos/dp/1783287012
[11]: https://github.com/twitter/scalding/wiki/Fields-based-API-Reference
[12]: https://github.com/twitter/scalding/wiki/Type-safe-api-reference
[13]: http://docs.cascading.org/cascading/2.0/javadoc/cascading/scheme/hadoop/TextDelimited.html
[14]: http://docs.cascading.org/cascading/2.2/javadoc/cascading/tuple/TupleEntry.html
[15]: http://docs.cascading.org/cascading/2.2/javadoc/cascading/tuple/Tuple.html
[16]: https://github.com/twitter/scalding/wiki/Matrix-API-Reference
[17]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop-implementing-a-left-outer-join-in-java-with-cascading.html
[18]: http://blog.matthewrathbone.com/2015/10/20/scalding-tutorial.html
