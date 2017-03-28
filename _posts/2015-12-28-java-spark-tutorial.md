---
layout: post
title: Apache Spark Java Tutorial with Code Examples
description: "To follow my post implementing a pipeline in regular Spark, I do the same thing with Java. The walkthrough includes open source code and unit tests."
coauthor: 
  name: Elena Akhmatova
  link: "https://ru.linkedin.com/pub/elena-akhmatova/3/877/266"
subject: spark
published: true
tags: 
- hive
- hadoop
- Spark
- Java
image:
  url: /img/blog/java-spark.jpg
  author:
    name: Jeremy Keith
    url: https://www.flickr.com/photos/adactio/1450394876
---

> This article is part of [my guide to map reduce frameworks][4] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.  
>  
> Spark is itself a general-purpose framework for cluster computing. It can be run, and is often run, on the Hadoop YARN. Thus it is often associated with Hadoop and so I have included it in [my guide to map reduce frameworks][4] as well. Spark is designed to be fast for interactive queries and iterative algorithms that Hadoop MapReduce can be slow with.
> 

## The Problem

Let me quickly restate the problem from [my original article][6].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I have implemented this solution [in java][7], [with hive][8] and [with pig][9]. The java solution was ~500 lines of code, hive and pig were like ~20 lines tops.

## The Java Spark Solution

This article is a follow up for my [earlier article][13] on [Spark][1] that shows a Scala Spark solution to the problem. Even though Scala is the native and more popular Spark language, many enterprise-level projects are written in Java and so it is supported by the Spark stack with it's own API.

This article partially repeats what was written in my Scala overview, although I emphasize the differences between Scala and Java implementations of logically same code.

As it was mentioned before, Spark is an open source project that has been built and is maintained by a thriving and diverse community of developers. It started in 2009 as a research project in the UC Berkeley RAD Labs. Its aim was to compensate for some Hadoop shortcomings. Spark brings us as interactive queries, better performance for iterative algorithms, as well as support for in-memory storage and efficient fault recovery.

It contains a number of different components, such as Spark Core, Spark SQL, Spark Streaming, MLlib, and GraphX. It runs over a variety of cluster managers, including Hadoop YARN, Apache Mesos, and a simple cluster manager included in Spark itself called the Standalone Scheduler. It is used for a diversity of tasks from data exploration through to streaming machine learning algorithms. As a technology stack it has really caught fire in recent years.

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

For this task we have used Spark on a Hadoop YARN cluster. Our code will read and write data from/to HDFS. Before starting work with the code we have to copy the input data to HDFS. 

{% highlight bash %}
hdfs dfs -mkdir input

hdfs dfs -put ./users.txt input
hdfs dfs -put ./transactions.txt input
{% endhighlight %}

## Code

All code and data used in this post can be found in my [hadoop examples GitHub repository][github].

{% highlight java %}
public class ExampleJob {
    private static JavaSparkContext sc; 
    
    public ExampleJob(JavaSparkContext sc){
      this.sc = sc;
    }
    
    public static final PairFunction<Tuple2<Integer, Optional<String>>, Integer, String> KEY_VALUE_PAIRER =
    new PairFunction<Tuple2<Integer, Optional<String>>, Integer, String>() {
      public Tuple2<Integer, String> call(
          Tuple2<Integer, Optional<String>> a) throws Exception {
      // a._2.isPresent()
        return new Tuple2<Integer, String>(a._1, a._2.get());
      }
  };
  
  public static JavaRDD<Tuple2<Integer,Optional<String>>> joinData(JavaPairRDD<Integer, Integer> t, JavaPairRDD<Integer, String> u){
        JavaRDD<Tuple2<Integer,Optional<String>>> leftJoinOutput = t.leftOuterJoin(u).values().distinct();
        return leftJoinOutput;
  }
  
  public static JavaPairRDD<Integer, String> modifyData(JavaRDD<Tuple2<Integer,Optional<String>>> d){
    return d.mapToPair(KEY_VALUE_PAIRER);
  }
  
  public static Map<Integer, Object> countData(JavaPairRDD<Integer, String> d){
        Map<Integer, Object> result = d.countByKey();
        return result;
  }
  
  public static JavaPairRDD<String, String> run(String t, String u){
        JavaRDD<String> transactionInputFile = sc.textFile(t);
        JavaPairRDD<Integer, Integer> transactionPairs = transactionInputFile.mapToPair(new PairFunction<String, Integer, Integer>() {
            public Tuple2<Integer, Integer> call(String s) {
                String[] transactionSplit = s.split("\t");
                return new Tuple2<Integer, Integer>(Integer.valueOf(transactionSplit[2]), Integer.valueOf(transactionSplit[1]));
            }
        });
        
        JavaRDD<String> customerInputFile = sc.textFile(u);
        JavaPairRDD<Integer, String> customerPairs = customerInputFile.mapToPair(new PairFunction<String, Integer, String>() {
            public Tuple2<Integer, String> call(String s) {
                String[] customerSplit = s.split("\t");
                return new Tuple2<Integer, String>(Integer.valueOf(customerSplit[0]), customerSplit[3]);
            }
        });

        Map<Integer, Object> result = countData(modifyData(joinData(transactionPairs, customerPairs)));
        
        List<Tuple2<String, String>> output = new ArrayList<>();
      for (Entry<Integer, Object> entry : result.entrySet()){
        output.add(new Tuple2<>(entry.getKey().toString(), String.valueOf((long)entry.getValue())));
      }

      JavaPairRDD<String, String> output_rdd = sc.parallelizePairs(output);
      return output_rdd;
  }
  
    public static void main(String[] args) throws Exception {
        JavaSparkContext sc = new JavaSparkContext(new SparkConf().setAppName("SparkJoins").setMaster("local"));
        ExampleJob job = new ExampleJob(sc);
        JavaPairRDD<String, String> output_rdd = job.run(args[0], args[1]);
        output_rdd.saveAsHadoopFile(args[2], String.class, String.class, TextOutputFormat.class);
        sc.close();
    }
}
{% endhighlight %}

This code does exactly the same thing that the corresponding code of the Scala solution does. The sequence of actions is exactly the same, as well as the input and output data on each step.

1. read / transform transactions data
2. read / transform users data
3. left outer join of transactions on users
4. get rid of user_id key from the result of the previous step by applying `values()`
5. find `distinct()` values
6. `countByKey()`
7. transform result to an RDD
8. save result to Hadoop

If this is confusing (it might be), [read the Scala version first][13], it is way more compact.

As with Scala it is required to define a SparkContext first. Again, it is enough to set an app name and a location of a master node.

{% highlight java %}
JavaSparkContext sc = new JavaSparkContext(new SparkConf().setAppName("Spark Count").setMaster("local"));
{% endhighlight %}

The resilient distributed dataset (RDD), Spark’s core abstraction for working with data, is named RDD as in Scala. As with any other Spark data-processing algorithm all our work is expressed as either creating new RDDs, `transforming` existing RDDs, or calling `actions` on RDDs to compute a result.

Spark's Key/value RDDs are of `JavaPairRDD` type. Key/value RDDs are commonly used to perform aggregations, such as groupByKey(), and are useful for joins, such as leftOuterJoin(). Explicitly defining key and value elements allows spark to abstract away a lot of these complex operations (like joins), so they are very useful.

Here is how the input and intermediate data is transformed into a Key/value RDD in Java:

{% highlight java %}
JavaRDD<String> transactionInputFile = sc.textFile(t);
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

Reading input data is done in exactly same manner as in Scala. Note that the explicit KEY_VALUE_PAIRER transformation is not needed in Scala, but in Java there seems to be no way to skip it. 

Spark has added an `Optional` class for Java (similar to Scala's `Option`) to box values and avoid nulls. There is a special function `isPresent()` in the `Optional` class that allows to check whether the value is present, that is it is not null. Calling `get()` returns the boxed value. 

The main code is again more or less a chain of pre-defined functions.

{% highlight java %}
public static JavaRDD<Tuple2<Integer,Optional<String>>> joinData(JavaPairRDD<Integer, Integer> t, JavaPairRDD<Integer, String> u){
  JavaRDD<Tuple2<Integer,Optional<String>>> leftJoinOutput = t.leftOuterJoin(u).values().distinct();
  return leftJoinOutput;
}
{% endhighlight %}

{% highlight java %}
public static JavaPairRDD<Integer, String> modifyData(JavaRDD<Tuple2<Integer,Optional<String>>> d){
  return d.mapToPair(KEY_VALUE_PAIRER);
}
{% endhighlight %}

{% highlight java %}
public static Map<Integer, Object> countData(JavaPairRDD<Integer, String> d){
  Map<Integer, Object> result = d.countByKey();
  return result;
}
{% endhighlight %}

The `processData()` function from the Scala version was broken into three new functions `joinData()`, `modifyData()` and `countData()`. We simply did this to make the code more clear -- Java is verbose. All the data transformation steps could have been put into one function that would be similar to `processData()` from the Scala solution.

The `leftOuterJoin()` function joins two RDDs on key. 

The `values()` functions allows us to omit the key of the Key Value RDD as it is not needed in the operations that follow the join. The `distinct()` function selects distict Tuples.

And finally `countByKey()` counts the number of countries where the product was sold.

## Running the resulting jar

{% highlight bash%}
/usr/bin/spark-submit --class main.java.com.matthewrathbone.sparktest.SparkJoins --master local ./spark-example-1.0-SNAPSHOT-jar-with-dependencies.jar /path/to/transactions.txt /path/to/users.txt /path/to/output_folder

15/12/20 11:49:47 INFO DAGScheduler: Job 2 finished: countByKey at SparkJoins.java:74, took 0.171325 s
CountByKey function Output: {1=3, 2=1}

$ hadoop fs -ls sparkout
Found 9 items
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/_SUCCESS
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/part-00000
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/part-00001
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/part-00002
-rw-r--r--   1 hadoop hadoop          4 2015-12-20 11:49 sparkout/part-00003
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/part-00004
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/part-00005
-rw-r--r--   1 hadoop hadoop          0 2015-12-20 11:49 sparkout/part-00006
-rw-r--r--   1 hadoop hadoop          4 2015-12-20 11:49 sparkout/part-00007
$ hadoop fs -tail sparkout/part-00003
1 3
$ hadoop fs -tail sparkout/part-00007
2 1
{% endhighlight%}
 
## Testing

The idea and the set up are exactly the same for Java and Scala. 

{% highlight java %}
public class SparkJavaJoinsTest implements Serializable {
  private static final long serialVersionUID = 1L;
  private transient JavaSparkContext sc;

  @Before
  public void setUp() {
    sc = new JavaSparkContext("local", "SparkJoinsTest");
  }

  @After
  public void tearDown() {
    if (sc != null){
      sc.stop();
    }
  }

  @Test
  public void testExampleJob() {
  
    ExampleJob job = new ExampleJob(sc);
    JavaPairRDD<String, String> result = job.run("./transactions.txt", "./users.txt");
        
    Assert.assertEquals("1", result.collect().get(0)._1);
    Assert.assertEquals("3", result.collect().get(0)._2);
    Assert.assertEquals("2", result.collect().get(1)._1);
    Assert.assertEquals("1", result.collect().get(1)._2);
  
  }
}
{% endhighlight %}

The test is more or less self-explanatory. As usually we check the content of the output to validate it's operation.


## Thoughts

Java is a lot more verbose than Scala, although this is not a Spark-specific criticism.

The Scala and Java Spark APIs have a very similar set of functions. Looking beyond the heaviness of the Java code reveals calling methods in the same order and following the same logical thinking, albeit with more code.

All things considered, if I were using Spark, I'd use Scala. The functional aspects of Spark are designed to feel native to Scala developers, which means it feels a little alien when working in Java (eg `Optional`). That said, if Java is the only option (or you really don't want to learn Scala), Spark certainly presents a capable API to work with.

## Spark Resources 

The Spark [official site][1] and [Spark GitHub][12] have resources related to Spark.

## Further Reading

[Learning Spark: Lightning-Fast Big Data Analysis][10] by Holden Karau, Andy Konwinski, Patrick Wendell, Matei Zaharia.

[1]: http://spark.apache.org
[2]: https://github.com/apache/spark/blob/master/core/src/test/java/org/apache/spark/JavaAPISuite.java
[3]: https://www.safaribooksonline.com/library/view/learning-spark/9781449359034
[4]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[5]: http://blog.matthewrathbone.com/2015/06/25/real-world-hadoop---implementing-a-left-outer-join-in-java-with-cascading.html
[6]: http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[7]: http://blog.matthewrathbone.com/2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[8]: http://blog.matthewrathbone.com/2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[9]: http://blog.matthewrathbone.com/2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[10]: http://www.amazon.com/Learning-Spark-Lightning-Fast-Data-Analysis/dp/1449358624
[11]: http://shop.oreilly.com/product/0636920028512.do
[12]: https://github.com/apache/spark
[13]: /2015/12/14/spark-scala-tutorial.html
[github]: https://github.com/rathboma/hadoop-framework-examples/
