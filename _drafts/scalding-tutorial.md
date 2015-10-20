---
title: Real World Hadoop - Implementing a left outer join in Scala with Scalding
layout: post
description: Data processing pipelines with Scalding
topic: engineering
author: matthew_rathbone
published: false
coauthor:
  name: Elena Akhmatova
  link: https://ru.linkedin.com/pub/elena-akhmatova/3/877/266
categories:
- hadoop
tags:
- hive
- hadoop
- Cascading
---

> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
>  
> Perhaps it is best to read this article together with an article about Cascading as the two frameworks are connected.
> 
> * [Post 1][5] - Real World Hadoop - Implementing a left outer join in Java with Cascading
> * Post 2 - you're reading it!
>

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Scalding Solution

[Scalding][1] is a Scala API developed at Twitter for distributed data programming that uses the [Cascading Java API][2], which in turn sits on top of Hadoop's Java API. As in the case with Cascading the goal of Scalding is to make building data processing pipelines easier than using the basic map and reduce interface provided by Hadoop.


## Demonstration Data

The tables that will be used for demonstration are called `users` and `transactions`. 

{% highlight bash %}
users
1 matthew@test.com  EN  US
2 matthew@test2.com EN  GB
3 matthew@test3.com FR  FR
{% endhighlight %}

and

{% highlight bash %}
transactions
1 1 1 300 a jumper
2 1 2 300 a jumper
3 1 2 300 a jumper
4 2 3 100 a rubber chicken
5 1 3 300 a jumper
{% endhighlight %}

Our code will read and write data from/to HDFS. Before starting work with the code we have to copy the input data to HDFS. Unlike Cascading Scalding job wants an output directory to be created for it prior to executing the job.

{% highlight bash %}
hdfs dfs -mkdir input1
hdfs dfs -mkdir input2
hdfs dfs -mkdir output

hdfs dfs -put ./users.txt input1
hdfs dfs -put ./transactions.txt input2
{% endhighlight %}

## Code

All code and data used in this post can be found in my [`hadoop framework examples` GitHub repository][github].

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

TextLine class we use to read input data reads the data line by line. We have an ability to immediately parse the input line to create a table with known column names with which one can operate further. 

{% highlight scala %}
val usersInput = input1.read.mapTo( inputFields -> users ) { te: TupleEntry =>
  val split = te.getString( "line" ).split("\t");
  (split( 0 ), split( 1 ), split( 2 ), split( 3 ))
}
{% endhighlight %}

It seems to be unnecessary for such a simple lines of data as the lines used for the example. Such a setup may be quite convenient in a case of more complex text lines requiring extensive preprocessing. 

The complex query that retrieves data in a required format is a one-liner that is quite self explanatory.

{% highlight scala %}
val joinedBranch =  transactionsInput
    .joinWithSmaller('user_id -> 'id, usersInput)
  .project('product_id, 'location)
  .unique('product_id, 'location)
  .groupBy('product_id) {group => group.size(Set('location))}
  .write(output)
{% endhighlight %}

It starts with a join on a user_id `.joinWithSmaller('user_id -> 'id, usersInput)`, then function project retains only two fields from the resulting join `.project('product_id, 'location)`, namely product_id and location. Then we first pre-select unique pairs of product_id and location `.unique('product_id, 'location)`. This allows us to simply use function size during the group by operation on product_id `.groupBy('product_id) {group => group.size(Set('location))}`. The final output goes to the output folder `.write(output)`.

## Running the resulting jar

{% highlight scala %}
hadoop jar scala-scalding-1.0-SNAPSHOT-jar-with-dependencies.jar com.twitter.scalding.Tool main.scala.com.matthewrathbone.scalding.Main --hdfs --input1 input1 --input2 input2 --output output

hdfs dfs -copyToLocal output/part-00000 .
cat part-00000 
1 3
2 1

{% endhighlight%}
 
## Testing

[JobTest class][11] is used to construct unit tests for scalding jobs. Official scalding tutorial on [cascading.org][3] advises that it should not be used unless it is for testing purposes, whatever it means. For examples of unit testing of different parts of scalding code, see the tests included in the [main scalding repository][3]. The most relevant to our case and the most neat test example there is a [WordCount test][12]. Drawing on that we have a very concise and good-looking test that you can see below.

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

As you can easily see the Jobtest gives the function Main input parameters that are specified in `.source`, and sinks the output as an (Int, Int) tuple that we use as a Map `val outMap = outputBuffer.toMap` to do simple checks as:

> * There should be 3 distinct locations where product 1 has been sold: `outMap(1) shouldBe 3`
> * There should be only 1 location where product 2 has been sold: `outMap(2) shouldBe 1`

## Thoughts

Both the main code and the test code were really good-looking and nice. An ability to process input data when reading it can be done in a convenient way. It is a good alternative to a Hive UDF, for example. I think developers who genuinely like Scala and need to write tasks for data processing on Hadoop benefit a lot from having this tool at their disposal.

## Scalding Resources 

[Cascading web-site][2] has resources related to both Cascading and Scalding.

## Further Reading

PACKT Publishing â€˜Programming MapReduce with Scalding: A practical guide to designing, testing, and implementing complex MapReduce applications in Scalaâ€™ Book

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
[11]: https://twitter.github.io/scalding/index.html#com.twitter.scalding.JobTest
[12]: https://github.com/twitter/scalding/blob/master/scalding-core/src/test/scala/com/twitter/scalding/WordCountTest.scala
[github]: https://github.com/rathboma/hadoop-framework-examples