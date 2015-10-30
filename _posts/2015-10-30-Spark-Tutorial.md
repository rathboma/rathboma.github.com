---
title: Real World Hadoop - Implementing a left outer join in Java with Spark
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

## The Spark Solution

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

{% highlight java %}
public class SparkJoins {
    @SuppressWarnings("serial")
    
    public static final PairFunction<Tuple2<Integer, Optional<String>>, Integer, String> KEY_VALUE_PAIRER =
    new PairFunction<Tuple2<Integer, Optional<String>>, Integer, String>() {
    	public Tuple2<Integer, String> call(
    			Tuple2<Integer, Optional<String>> a) throws Exception {
			// a._2.isPresent()
    		return new Tuple2<Integer, String>(a._1, a._2.get());
    	}
	};
    
    public static void main(String[] args) throws FileNotFoundException {
    	// SPARK_USER
        JavaSparkContext sc = new JavaSparkContext(new SparkConf().setAppName("SparkJoins").setMaster("local"));

        JavaRDD<String> transactionInputFile = sc.textFile(args[0]);
        JavaPairRDD<Integer, Integer> transactionPairs = transactionInputFile.mapToPair(new PairFunction<String, Integer, Integer>() {
            public Tuple2<Integer, Integer> call(String s) {
                String[] transactionSplit = s.split("\t");
                return new Tuple2<Integer, Integer>(Integer.valueOf(transactionSplit[2]), Integer.valueOf(transactionSplit[1]));
            }
        });
        
        JavaRDD<String> customerInputFile = sc.textFile(args[1]);
        JavaPairRDD<Integer, String> customerPairs = customerInputFile.mapToPair(new PairFunction<String, Integer, String>() {
            public Tuple2<Integer, String> call(String s) {
                String[] customerSplit = s.split("\t");
                return new Tuple2<Integer, String>(Integer.valueOf(customerSplit[0]), customerSplit[3]);
            }
        });

        //Left Outer join operation
        JavaRDD<Tuple2<Integer,Optional<String>>> leftJoinOutput = transactionPairs.leftOuterJoin(customerPairs).values().distinct();
        System.out.println("LeftOuterJoins function Output: "+leftJoinOutput.collect());
        JavaPairRDD<Integer, String> res = leftJoinOutput.mapToPair(KEY_VALUE_PAIRER);
        System.out.println("MapToPair function Output: "+res.collect());
        Map<Integer, Object> result = res.countByKey();
        System.out.println("CountByKey function Output: "+result.toString());
        
        List<Tuple2<Integer, Long>> output = new ArrayList<>();
        for (Entry<Integer, Object> entry : result.entrySet()){
                output.add(new Tuple2<>(entry.getKey(), (long)entry.getValue()));
        }

        JavaPairRDD<Integer, Long> output_rdd = sc.parallelizePairs(output);
        output_rdd.saveAsHadoopFile(args[2], Integer.class, String.class, TextOutputFormat.class);
        sc.close();
    }
}
{% endhighlight %}

Prior to manipulating the data it is required to define SparkContext. It is enough to set an app name and a location of a master node.

{% highlight java %}
JavaSparkContext sc = new JavaSparkContext(new SparkConf().setAppName("Spark Count").setMaster("local"));
{% endhighlight %}

Spark’s core abstraction for working with data is the resilient distributed dataset (RDD). It is Spark’s main programming abstraction. An RDD in Spark is simply an immutable distributed collection of objects. Each RDD is split into multiple partitions, which may be computed on different nodes of the cluster. RDDs can contain any type of Python, Java, or Scala objects, including user-defined classes. 

In Spark all work is expressed as either creating new RDDs, transforming existing RDDs, or calling operations on RDDs to compute a result. Spark automatically distributes the data contained in RDDs across the cluster and parallelizes the operations that are performed on them.

The task we have is solved by using Spark's Key/value RDDs. Key/value RDDs are commonly used to perform aggregations, such as groupByKey(), and are useful for joins, such as leftOuterJoin(). 

Here is how the input and intermediate data is transformed into a Key/value RDD:

{% highlight java %}
JavaRDD<String> transactionInputFile = sc.textFile(args[0]);
JavaPairRDD<Integer, Integer> transactionPairs = transactionInputFile.mapToPair(new PairFunction<String, Integer, Integer>() {
	public Tuple2<Integer, Integer> call(String s) {
		String[] transactionSplit = s.split("\t");
		return new Tuple2<Integer, Integer>(Integer.valueOf(transactionSplit[2]), Integer.valueOf(transactionSplit[1]));
	}
});
{% endhighlight %}

and a stand-alone function

{% highlight java %}
public static final PairFunction<Tuple2<Integer, Optional<String>>, Integer, String> KEY_VALUE_PAIRER =
new PairFunction<Tuple2<Integer, Optional<String>>, Integer, String>() {
    	public Tuple2<Integer, String> call(
    			Tuple2<Integer, Optional<String>> a) throws Exception {
			// a._2.isPresent()
    		return new Tuple2<Integer, String>(a._1, a._2.get());
    	}
};
{% endhighlight %}

An addition of Optional class over the String caters for possible null values. There is a special function isPresent() in the Optional class that allows to check whether the value is present, that is it is not null.

The rest of the code is more or less a chain of pre-defined functions.

{% highlight java %}
JavaRDD<Tuple2<Integer,Optional<String>>> leftJoinOutput = transactionPairs.leftOuterJoin(customerPairs).values().distinct();
...
JavaPairRDD<Integer, String> res = leftJoinOutput.mapToPair(KEY_VALUE_PAIRER);
...
Map<Integer, Object> result = res.countByKey();
{% endhighlight %}

The leftOuterJoin() function joins two RDDs on key. The values() functions allows to omit the key of the join as it is not needed in the operations that follow the join. The distinct() function selects distict Tuples, and countByKey() counts the number of countries where the product was sold.

## Running the resulting jar

{% highlight bash%}
/usr/bin/spark-submit --class main.java.com.matthewrathbone.sparktest.SparkJoins --master local ./spark-example-1.0-SNAPSHOT-jar-with-dependencies.jar /path/to/transactions.txt /path/to/users.txt /path/to/output_folder

15/10/30 11:49:47 INFO DAGScheduler: Job 2 finished: countByKey at SparkJoins.java:74, took 0.171325 s
CountByKey function Output: {1=3, 2=1}

$ hadoop fs -ls sparkout
Found 9 items
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/_SUCCESS
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/part-00000
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/part-00001
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/part-00002
-rw-r--r--   1 hadoop hadoop          4 2015-10-30 11:49 sparkout/part-00003
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/part-00004
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/part-00005
-rw-r--r--   1 hadoop hadoop          0 2015-10-30 11:49 sparkout/part-00006
-rw-r--r--   1 hadoop hadoop          4 2015-10-30 11:49 sparkout/part-00007
$ hadoop fs -tail sparkout/part-00003
1	3
$ hadoop fs -tail sparkout/part-00007
2	1
{% endhighlight%}
 
## Testing

As with other frameworks it made sense to draw on the existing official tests in [Spark GitHub][2]. 

{% highlight java %}
public class SparkJoinsTest implements Serializable {
	  private transient JavaSparkContext sc;
	  private transient File tempDir;

	  @Before
	  public void setUp() {
	    sc = new JavaSparkContext("local", "SparkJoinsTest");
	    tempDir = Files.createTempDir();
	    tempDir.deleteOnExit();
	  }

	  @After
	  public void tearDown() {
	    sc.stop();
	    sc = null;
	  }
	  
	  @Test
	  public void sortByKey() {
	    List<Tuple2<Integer, Integer>> transactions = new ArrayList<>();
	    transactions.add(new Tuple2<>(1, 1));
	    transactions.add(new Tuple2<>(2, 1));
	    transactions.add(new Tuple2<>(2, 1));
	    transactions.add(new Tuple2<>(3, 2));
	    transactions.add(new Tuple2<>(3, 1));
	    
	    List<Tuple2<Integer, String>> users = new ArrayList<>();
	    users.add(new Tuple2<>(1, "US"));
	    users.add(new Tuple2<>(2, "GB"));
	    users.add(new Tuple2<>(3, "FR"));

	    JavaPairRDD<Integer, Integer> transactions_rdd = sc.parallelizePairs(transactions);
	    JavaPairRDD<Integer, String> users_rdd = sc.parallelizePairs(users);

	    JavaRDD<Tuple2<Integer,Optional<String>>> leftJoinOutput = transactions_rdd.leftOuterJoin(users_rdd).values().distinct();
	    
	    Assert.assertEquals(4, leftJoinOutput.count());
	    JavaPairRDD<Integer, String> res = leftJoinOutput.mapToPair(SparkJoins.KEY_VALUE_PAIRER);
	    List<Tuple2<Integer, String>> sortedRes = res.sortByKey().collect();
	    Assert.assertEquals(1, sortedRes.get(0)._1.intValue());
	    Assert.assertEquals(1, sortedRes.get(1)._1.intValue());
	    Assert.assertEquals(1, sortedRes.get(2)._1.intValue());
	    Assert.assertEquals(2, sortedRes.get(3)._1.intValue());
	    
	    Map<Integer, Object> result = res.countByKey();
	    Assert.assertEquals((long)3, result.get(1));
	    Assert.assertEquals((long)1, result.get(2));
	    
	  }
}
{% endhighlight %}

The test is more or less self-explanatory. We can check for the expected number of rows in the output and their content.

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
[github]: https://github.com/rathboma/hadoop-framework-examples
