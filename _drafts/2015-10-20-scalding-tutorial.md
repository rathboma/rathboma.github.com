---
title: Real World Hadoop - Implementing a left outer join in Scala with Scalding
layout: post
description: "How to implement some real world code with Scalding, a Scala wrapper for Cascading"
subject: hadoop
coauthor:
  name: Elena Akhmatova
  link: https://ru.linkedin.com/pub/elena-akhmatova/3/877/266
tags:
- hive
- hadoop
- Cascading
---


This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.

>  
> Perhaps it is best to read this article together with my article about Cascading, as Scalding is based on Cascading.
> 
> * [Real World Hadoop - Implementing a left outer join in Java with Cascading][5]
>

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in several other languages][4], including [java][7], [hiveQL][8] and [pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Scalding Solution


[Scalding][1] is a Scala API developed at Twitter for distributed data programming that uses the [Cascading Java API][2], which in turn sits on top of Hadoop's Java API. Scalding is pitched as *a scala DSL for cascading*, with the assetion that writing regular Cascading [*seem like assembly language programming in comparison*](https://www.safaribooksonline.com/library/view/enterprise-data-workflows/9781449359584/ch04.html). 

As in the case with Cascading, the goal of Scalding is to make building data processing pipelines easier than using the basic map and reduce interface provided by Hadoop. The Scalding community is very active (as of the time of writing - October 2015), and there are many libraries built on top of scalding extending it's functionality. Some pretty big organizations use Scalding, like Twitter, Foursquare, LinkedIn, Etsy, eBay and more.

For those who have read my [scoobi walkthrough](http://blog.matthewrathbone.com/2013/11/03/real-world-hadoop---implementing-a-left-outer-join-with-scoobi.html), scalding may feel familiar.


## Demonstration Data

The tables that will be used for demonstration are called `users` and `transactions`. 

{% highlight bash %}
cat users.txt
1 matthew@test.com  EN  US
2 matthew@test2.com EN  GB
3 matthew@test3.com FR  FR
{% endhighlight %}

and

{% highlight bash %}
cat transactions.txt
1 1 1 300 a jumper
2 1 2 300 a jumper
3 1 2 300 a jumper
4 2 3 100 a rubber chicken
5 1 3 300 a jumper
{% endhighlight %}

Our code will read and write data from/to HDFS. Before starting work with the code we have to copy the input data to HDFS. Unlike Cascading, the Scalding job wants an output directory to be created for it prior to executing the job.

{% highlight bash %}
hdfs dfs -mkdir input1
hdfs dfs -mkdir input2
hdfs dfs -mkdir output

hdfs dfs -put ./users.txt input1
hdfs dfs -put ./transactions.txt input2
{% endhighlight %}

## Code

All code and data used in this post can be found in my [hadoop framework examples GitHub repository][github].

The full solution is below, it's a pretty small amount of code which is great, although for those unfamiliar with Scala it may look confusing.

{% highlight scala %}

class Main ( args: Args ) extends Job( args ) {
    val inputFields = 'line
    val users = ( 'id, 'email, 'language, 'location)
    val transactions = ( 'transaction_id, 'product_id, 'user_id, 'purchase_amount, 'item_description);
  
    val input1 = TextLine( args( "input1" ) )
    val input2 = TextLine( args( "input2" ) )
    val output = Tsv( args( "output" ) )
  
    val usersInput = input1.read.mapTo( inputFields -> users ) { te: TupleEntry =>
      val split = te.getString( "line" ).split("\t");
      (split( 0 ), split( 1 ), split( 2 ), split( 3 ))
    }

    val transactionsInput = input2.read.mapTo( inputFields -> transactions ) { te: TupleEntry =>
      val split = te.getString( "line" ).split("\t");
      (split( 0 ), split( 1 ), split( 2 ), split( 3 ), split( 4 ))
    }
  
    val joinedBranch =  transactionsInput
      .joinWithSmaller('user_id -> 'id, usersInput)
      .project('product_id, 'location)
      .unique('product_id, 'location)
      .groupBy('product_id) {group => group.size(Set('location))}
      .write(output)
  }

{% endhighlight %}

Notice the fairly liberal use of scala symbols (`'iAmASymbol`), something that likely has it's roots in the Ruby world thanks to Twitter as few other scala libraries use this feature all that much.

### Walkthrough

The TextLine class we use to read input data reads the data line by line. We have the ability to immediately parse the input line to create a dataset with known column names with which we can operate upon further:

{% highlight scala %}

val usersInput = input1.read.mapTo( inputFields -> users ) { te: TupleEntry =>
  val split = te.getString( "line" ).split("\t");
  (split( 0 ), split( 1 ), split( 2 ), split( 3 ))
}

{% endhighlight %}

While this seems trivial for such simple data, such functionality is very useful for much larger datasets that form part of larger pipelines.

The most confusing part of the solution is the final block of code, but it's actually quite straight forward.

{% highlight scala %}
val joinedBranch =  transactionsInput
    .joinWithSmaller('user_id -> 'id, usersInput)
  .project('product_id, 'location)
  .unique('product_id, 'location)
  .groupBy('product_id) {group => group.size(Set('location))}
  .write(output)
{% endhighlight %}

Here it is step by step in plain english:

1. Take the transactions and join them to users based on `transaction#user_id` = `users#id`
2. `project` retains only the specified fields from the resulting join, in this case `product_id` and `location`.
3. They we select only unique pairs of each product/location combo. This allows us to use the `size` function to count distinct locations in the next step.
4. Finally, we group our results by product id, and aggregate the remaining records by counting the number of locations associated with that product.
5. At the end we write the results to our output directory.


## Running the resulting jar

{% highlight scala %}
hadoop jar scala-scalding-1.0-SNAPSHOT-jar-with-dependencies.jar com.twitter.scalding.Tool main.scala.com.matthewrathbone.scalding.Main --hdfs --input1 input1 --input2 input2 --output output

hdfs fs -text output/part-*
1 3
2 1

{% endhighlight%}
 
## Testing

The [JobTest class][11] is used to construct unit tests for scalding jobs. The official scalding documentation on [cascading.org][3] advises that it should not be used unless it is for testing purposes, so I guess some folks have tried to use it in production somehow (don't do this). For examples of unit testing the different parts of scalding code, see the tests included in the [main scalding repository][3]. The most relevant to our case and the most neat test example there is a [WordCount test][12]. Drawing on that I have written a fairly concise test that you can see below.

{% highlight scala %}

class MainFunctionJoinTest extends WordSpec with Matchers {
  "Our job" should {
    JobTest(new main.scala.Main(_))
      .arg("input1", "usersInput")
      .arg("input2", "transactionsInput")
      .arg("output", "outputFile")
      .source(TextLine("usersInput"), List((0, "1 matthew@test.com  EN  US"), (1, "2  matthew@test2.com EN  GB"), (2, "3  matthew@test3.com FR  FR")))
      .source(TextLine("transactionsInput"), List((0, "1  1 1 300 a jumper"), (1, "2  1 2 300 a jumper"), (2, "3  1 2 300 a jumper"), (3, "4  2 3 100 a rubber chicken"), (4, "5  1 3 300 a jumper")))
      .sink[(Int, Int)](Tsv("outputFile")){ outputBuffer =>
        val outMap = outputBuffer.toMap
        "count number of locations per product correctly" in {
          outMap(1) shouldBe 3
          outMap(2) shouldBe 1
        }
      }
      .run
      .finish
  }
}

{% endhighlight %}

The `JobTest` gives us the ability to define inputs with `.source`, and sinks the output as an (Int, Int) tuple we read into a hashmap structure called `outMap` and check two things:

* Product 1 has been sold in 3 locations: `outMap(1) shouldBe 3`
* Product 2 has been sold in 1 location : `outMap(2) shouldBe 1`

## Thoughts

Both the main code and the test code are really concise with Scalding. The serialization and deserialization functions are pretty slick, and make working with Hadoop a lot easier. It is a good alternative to a Hive UDF for those who like working in code rather than SQL. I think developers who genuinely like Scala and need to write tasks for data processing on Hadoop benefit a lot from having this tool at their disposal.

The caveat to this is that you need to know scala to get a lot out of Scalding. Scala is a pretty complex language, so if you're new to both Hadoop and Scala, this might be a pretty rough place to start.


## Scalding Resources 

The [Cascading web-site][2] has resources related to both Cascading and Scalding.

<div class="clearfix"></div>

<a href="http://www.amazon.com/dp/1783287012?tag=matratsblo-20"><img src="/img/scalding-book.jpg" alt="" class="inline-img"></a>

[Programming MapReduce with Scalding](http://www.amazon.com/dp/1783287012?tag=matratsblo-20) is available on Amazon and should provide a practical guide to working with Scalding.

<div class="clearfix"></div>


[1]: https://github.com/twitter/scalding
[2]: http://www.cascading.org
[3]: https://github.com/twitter/scalding/tree/master/scalding-core/src/test/scala/com/twitter/scalding
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[5]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop---implementing-a-left-outer-join-in-java-with-cascading.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[11]: https://twitter.github.io/scalding/index.html#com.twitter.scalding.JobTest
[12]: https://github.com/twitter/scalding/blob/master/scalding-core/src/test/scala/com/twitter/scalding/WordCountTest.scala
[github]: https://github.com/rathboma/hadoop-framework-examples