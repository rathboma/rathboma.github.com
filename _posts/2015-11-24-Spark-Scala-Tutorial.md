---
title: Real World Hadoop - Implementing a left outer join in Scala with Spark
layout: post
description: Data processing pipelines with Spark
topic: engineering
author: matthew_rathbone
coauthor:
  name: Elena Akhmatova
  link: https://ru.linkedin.com/pub/elena-akhmatova/3/877/266
categories:
- hadoop
tags:
- hive
- hadoop
- Spark
- scala
---

> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
>  
> Spark is itself a general-purpose framework for cluster computing. It can be run, and is often run, on the Hadoop YARN. Thus it is often associated with Hadoop and I put it to my [my guide to map reduce frameworks][4] as well. It was designed to be fast for interactive queries and iterative algorithms the Hadoop MapReduce is a bit slow with.
> 

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Spark Scala Solution

[Spark][1] is an open source project that has been built and is maintained by a thriving and diverse community of developers. Spark started in 2009 as a research project in the UC Berkeley RAD Lab, later to become the AMPLab. It was observed that MapReduce was inefficient for some iterative and interactive computing jobs. Thus, Spark was designed. Its aim is to be fast for interactive queries and iterative algorithms, bringing support for in-memory storage and efficient fault recovery.

## Demonstration Data

The tables that will be used for demonstration are called `users` and `transactions`. 

{% highlight bash %}
users
1	matthew@test.com	EN	US
2	matthew@test2.com	EN	GB
3	matthew@test3.com	FR	FR
{% endhighlight %}

and

{% highlight bash %}
transactions
1	1	1	300	a jumper
2	1	2	300	a jumper
3	1	2	300	a jumper
4	2	3	100	a rubber chicken
5	1	3	300	a jumper
{% endhighlight %}

For this task we have used Spark on Hadoop YARN cluster. Our code will read and write data from/to HDFS. Before starting work with the code we have to copy the input data to HDFS. 

{% highlight bash %}
hdfs dfs -mkdir input

hdfs dfs -put ./users.txt input
hdfs dfs -put ./transactions.txt input
{% endhighlight %}

## Code

All code and data used in this post can be found in my [`hive examples` GitHub repository][github].

{% highlight scala %}
class ExampleJob(sc: SparkContext) {
  def run(t: String, u: String) : RDD[(String, String)] = {
        val transactions = sc.textFile(t)
	val newTransactionsPair = transactions.map{t =>                
	    val p = t.split("\t")
	    (p(2).toInt, p(1).toInt)
	}
	
	val users = sc.textFile(u)
	val newUsersPair = users.map{t =>                
	    val p = t.split("\t")
	    (p(0).toInt, p(3))
	}
	
	val result = processData(newTransactionsPair, newUsersPair)
	return sc.parallelize(result.toSeq).map(t => (t._1.toString, t._2.toString))
  } 
  
  def processData (t: RDD[(Int, Int)], u: RDD[(Int, String)]) : Map[Int,Long] = {
	var jn = t.leftOuterJoin(u).values.distinct
	return jn.countByKey
  }
}

object ExampleJob {
  def main(args: Array[String]) {
    val transactionsIn = args(1)
    val usersIn = args(0)
    val conf = new SparkConf().setAppName("SparkJoins").setMaster("local")
    val conext = new SparkContext(conf)
    val job = new ExampleJob(context)
    val results = job.run(transactionsIn, usersIn)
    val output = args(2)
    results.saveAsTextFile(output)
    context.stop()
  }
}
{% endhighlight %}

Prior to manipulating the data it is required to define SparkContext. It is enough to set an app name and a location of a master node.

{% highlight scala %}
val conf = new SparkConf().setAppName("SparkJoins").setMaster("local")
val sc = new SparkContext(conf)
{% endhighlight %}

Spark’s core abstraction for working with data is the resilient distributed dataset (RDD). Explicitely you can see it in the code when looking at `processData` function:

{% highlight scala %}
def processData (t: RDD[(Int, Int)], u: RDD[(Int, String)]) : Map[Int,Long] = {
	var jn = t.leftOuterJoin(u).values.distinct
	return jn.countByKey
}
{% endhighlight %}

Both `newTransactionsPair` and `newUsersPair` are RDDs. They are Key/Value RDDs to be more precise.

RDD is Spark’s main programming abstraction. An RDD in Spark is simply an immutable distributed collection of objects. Each RDD is split into multiple partitions, which may be computed on different nodes of the cluster. RDDs can contain any type of Python, Java, or Scala objects, including user-defined classes. 

In Spark all work is expressed as either creating new RDDs, transforming existing RDDs, or calling operations on RDDs to compute a result. Spark automatically distributes the data contained in RDDs across the cluster and parallelizes the operations that are performed on them.

Technically creating new and transforming existing RDDs - [transformation][13] in Spark - is different from calling an action to compute a result - an [action][14] in Spark. Actions result in actual processing the data, lets say by a MapReduce algorithm on HDFS. Work on transformations in its turn may wait till they are requested by an action. 

The task we have is solved by using Spark's Key/Value RDDs. Key/Value RDDs are commonly used to perform aggregations, such as groupByKey(), and are useful for joins, such as leftOuterJoin(). 

The actual action in our case is `countByKey()` (and `saveAsTextFile()` that is used to output result to HDFS). It is easy to see that using Spark CLI (spark-submit). Transformation returns info about the format the data is in after the transformation. Better to say, transformation notifies about a type of a new dataset it will create from the initial one (as RDDs are immutable). Calling an action will immediately result in getting logs about what is being done and how much has been done at the moment.

The process of transformation the input text file into a Key/value RDD is rather self-explanatory:

{% highlight scala %}
val transactions = sc.textFile(t)
val newTransactionsPair = transactions.map{t =>                
	val p = t.split("\t")
	(p(2).toInt, p(1).toInt)
}
{% endhighlight %}

The final result is also transformed into an RDD. This is done to use the RDD's saveAsTextFile function.

{% highlight scala %}
val r = sc.parallelize(result.toSeq).map(t => (t._1.toString, t._2.toString))
{% endhighlight %}

Here `toSeq` transforms the Map that `countByKey` of the `processData` function returns into an ArrayBuffer. This ArrayBuffer can be given as an input to `parallelize` function of SparkContext to follow up with a mapping into an RDD.

Join and Count operations are part of Spark. It did not take any effort to apply them.

{% highlight java %}
var jn = t.leftOuterJoin(u).values.distinct
return jn.countByKey
{% endhighlight %}

The `leftOuterJoin()` function joins two RDDs on key, that is why it was important that input RDDs are Key/Value RDDs. The result of the join is an RDD of a form RDD[(Int, (Int, Option[String]))]. 

The `values()` functions allows to omit the key of the join (user_id) as it is not needed in the operations that follow the join. 

The `distinct()` function selects distinct Tuples from the values of the join. 

The result of `values()` and `distinct()` functions is in a form of RDD[(Int, Option[String])].

`countByKey()` counts the number of countries where the product was sold. It will return a Map[Int,Long].

## Running the resulting jar

The best way to run a spark job is using spark-submit.

{% highlight bash%}
/usr/bin/spark-submit --class main.scala.com.matthewrathbone.spark.Main --master local ./target/scala-spark-1.0-SNAPSHOT-jar-with-dependencies.jar /path/to/transactions_test.txt /path/to/users_test.txt /path/to/output_folder

1	3
2	1
{% endhighlight%}
 
## Testing

As with other frameworks the idea was to follow closely the existing official tests in [Spark GitHub][2], using scalatests and JUnit in our case.

{% highlight scala %}
class SparkJoinsScalaTest extends AssertionsForJUnit {

  var sc: SparkContext = _
  
  @Before
  def initialize() {
	 val conf = new SparkConf().setAppName("SparkJoins").setMaster("local")
	 sc = new SparkContext(conf)
  }
  
  @After
  def tearDown() {
    sc.stop()
  }
  
  @Test
  def testExamleJobCode() {
    val job = new ExampleJob(sc)
    val result = job.run("./transactions.txt", "./users.txt")
    assert(result.collect()(0)._1 === "1")
    assert(result.collect()(0)._2 === "3")
    assert(result.collect()(1)._1 === "2")
    assert(result.collect()(1)._2 === "1")
  }
}
{% endhighlight %}

The test is more or less self-explanatory. We have checked at the end that the expected result is equal to the result that was obtained through the code.

## Thoughts

Spark is used for a diverse range of applications. It contains different components: Spark Core,
Spark SQL, Spark Streaming, MLlib, GraphX that solve diverse tasks from data manipulation to performing complex operations on data.

In addition to that Spark can run over a variety of cluster managers, including Hadoop YARN, Apache Mesos, and a simple cluster manager included in Spark itself called the Standalone Scheduler.

The tool is very versatile and useful to learn due to variety of usages. You may just learn how to perform the simple manipulations with data first, and then once a more complex problem occurs at least the first steps are done, the data is prepared in the right way. It is only needed to learn the new cool tools.

## Spark Resources 

Spark [official site][1] and [Spark GitHub][12] have resources related to Spark.

## Further Reading

O'REILLY Publishing ‘Learning Spark: Lightning-Fast Big Data Analysis’ Book

by Holden Karau, Andy Konwinski, Patrick Wendell, Matei Zaharia: from [Amazon][10] or [OREILLY][11].

or its on-line variant: [online-book][3].

[1]: http://spark.apache.org
[2]: https://github.com/apache/spark/blob/master/core/src/test/java/org/apache/spark/JavaAPISuite.java
[3]: https://www.safaribooksonline.com/library/view/learning-spark/9781449359034
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[5]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop---implementing-a-left-outer-join-in-java-with-cascading.html
[6]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[10]: http://www.amazon.com/Learning-Spark-Lightning-Fast-Data-Analysis/dp/1449358624
[11]: http://shop.oreilly.com/product/0636920028512.do
[12]: https://github.com/apache/spark
[13]: http://spark.apache.org/docs/latest/programming-guide.html#transformations
[14]: http://spark.apache.org/docs/latest/programming-guide.html#actions
