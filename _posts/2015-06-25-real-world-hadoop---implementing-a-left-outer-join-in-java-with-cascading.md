---
title: Real World Hadoop - Implementing a left outer join in Java with Cascading
layout: post
description: How to use Java & Cascading to perform a left outer join. Includes a comparison with Hive, Pig, and Java Mapreduce
subject: hadoop
coauthor:
  name: Elena Akhmatova
  link: https://ru.linkedin.com/pub/elena-akhmatova/3/877/266
tags:
- cascading
---

This article is part of [my guide to map reduce frameworks][1] in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.

This time I am implementing the solution using Cascading 2.7.0.

## The Problem

Let me quickly restate the problem from [my original article][3].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

Previously I implemented this solution [in java][4], [with hive][5] and [with pig][6]. The java solution was ~500 lines of code, hive and pig were ~20 lines maximum.

## The Cascading Solution

If you are impatient, you can [see the full implementation here][7].

Cascading is a data processing API that adds an abstraction layer over the Hadoop API.  It is used for defining, sharing, and executing data processing workflows. Its goal is to make building pipelines easier than using the basic map and to reduce interface provided by Hadoop. You use Cascading like any other API by making your code accessible to the cascading jar libraries that are distributed by cascading.org. The fastest way to get started with Cascading is to download [Cascading SDK][8] as it includes cascading and related projects in a single archive.

## SETUP

Cascading reads input data and writes output to a data resource (such as a file on the local file system) on a Hadoop distributed file system, or on S3 (look [here][9] for more details). HDFS serves as an input and output file system in this example. To start working with the code, copy your input data to HDFS. The output folder will be created by the cascading project. It must not exist when you are starting the execution of the program.

{% highlight bash %}
hdfs dfs -mkdir /path/to/users
hdfs dfs -put /path/to/local/file/with/users /path/to/users
hdfs dfs -mkdir /path/to/transactions
hdfs dfs -put /path/to/local/file/with/transactions /path/to/transactions
{% endhighlight %}

Thus, to start our task we put to HDFS
{% highlight bash %}
transactions
1 1 1 300 a jumper
2 1 2 300 a jumper
3 1 2 300 a jumper
4 2 3 100 a rubber chicken
5 1 3 300 a jumper
{% endhighlight %}

and
{% highlight bash %}
users
1 matthew@test.com  EN  US
2 matthew@test2.com EN  GB
3 matthew@test3.com FR  FR
{% endhighlight %}


The whole solution is here below (and can be downloaded from my [code repository][7]), I will go through each portion in detail:

{% highlight java %}

public class LocationsNumForAProduct {
  
  public static FlowDef createWorkflow(Tap usersTap, Tap transactionsTap, Tap outputTap ){
      Pipe transactionsPipe = new Pipe( "transactions_pipe" );
      
      Pipe usersPipe = new Pipe("join");
      Fields t_user_id = new Fields("user-id");
      Fields u_user_id = new Fields("id");
      Pipe joinPipe = new HashJoin( transactionsPipe, t_user_id, usersPipe, u_user_id, new LeftJoin() );
      
      Pipe retainPipe = new Pipe( "retain", joinPipe );
      retainPipe = new Retain( retainPipe, new Fields("product-id", "location"));
      
      Pipe cdistPipe = new Pipe( "cdistPipe", retainPipe );
      Fields selector = new Fields( "product-id", "location" );
      cdistPipe = new Unique( cdistPipe, selector );
   
      Fields cdist = new Fields( "cdist" );
      Fields product_id = new Fields("product-id");
      cdistPipe = new CountBy( cdistPipe, product_id, cdist );
      
      FlowDef flowDef = FlowDef.flowDef()
          .addSource( transactionsPipe, transactionsTap )
          .addSource( usersPipe, usersTap )
          .addTailSink( cdistPipe, outputTap );
      return flowDef;
  }
  
  public static void main(String[] args){
            String usersPath = args[ 0 ];
      String transactionsPath = args[ 1 ];
      String outputPath = args[ 2 ];
      
      Properties properties = new Properties();
      AppProps.setApplicationJarClass( properties, LocationsNumForAProduct.class );
      FlowConnector flowConnector = new Hadoop2MR1FlowConnector( properties );
      
      Fields users = new Fields( "id", "email", "language", "location" );
      Tap usersTap = new Hfs( new TextDelimited( users, false, "\t" ), usersPath );
      
      Fields transactions = new Fields( "transaction-id", "product-id", "user-id", "purchase-amount", "item-description" );
      Tap transactionsTap = new Hfs( new TextDelimited( transactions, false, "\t" ), transactionsPath );
            
      Tap outputTap = new Hfs( new TextDelimited( false, "\t" ), outputPath );
     
      FlowDef flowDef = createWorkflow(usersTap, transactionsTap, outputTap);
      flowConnector.connect( flowDef ).complete();
    }
}

{% endhighlight %}

Cascading provides an abstraction to MapReduce by describing data processing workflow in terms of [Taps][9], [Pipes][10] and [Sinks][11]. Data comes into the process from a Tap, passes through a few Pipes and finally flows into a Sink.

Processing input data starts with reading it into a Tap:

{% highlight java %}
Fields users = new Fields( "id", "email", "language", "location" );
Tap usersTap = new Hfs( new TextDelimited( users, false, "\t" ), usersPath );
{% endhighlight %}

It is rather important that we name the columns of the input data or we will have to refer to them by numbers, which is inconvenient. It is possible to provide an input file with a header to define the names directly. To do this, the second parameter of the `TextDelimited( users, *true*, "\t" )` function must be set to true. However this is usually not a good solution for larger datasets.

The second step in our process is to create a Pipe. The data comes from the Tap and goes through a number of transformations.

{% highlight java %}
Pipe usersPipe = new Pipe("join");
{% endhighlight %}

To connect all the Pipes together and get an output into a Sink a [Flow][17] is needed:

{% highlight java %}
FlowDef flowDef = FlowDef.flowDef()
  .addSource( transactionsPipe, transactionsTap )
  .addSource( usersPipe, usersTap )
  .addTailSink( cdistPipe, outputTap );
return flowDef;
{% endhighlight %}


In our case data for users and transactions goes straight to the joinPipe via transactionsPipe and usersPipe:

{% highlight java %}
Pipe usersPipe = new Pipe("join");
Fields t_user_id = new Fields("user-id");
Fields u_user_id = new Fields("id");
Pipe joinPipe = new HashJoin( transactionsPipe, t_user_id, usersPipe, u_user_id, new LeftJoin() );
{% endhighlight %}

This results are in a table with the fields that came from the two tables that were joined. We only need to retain two of them: `product-id` and `location`:

{% highlight java %}
Pipe retainPipe = new Pipe( "retain", joinPipe );
retainPipe = new Retain( retainPipe, new Fields("product-id", "location"));
{% endhighlight %}

Now we count unique locations for each product:

{% highlight java %}
Pipe cdistPipe = new Pipe( "cdistPipe", retainPipe );
Fields selector = new Fields( "product-id", "location" );
cdistPipe = new Unique( cdistPipe, selector );
   
Fields cdist = new Fields( "cdist" );
Fields product_id = new Fields("product-id");
cdistPipe = new CountBy( cdistPipe, product_id, cdist );
{% endhighlight %}

### Summary

So the data travels via `transactionsPipe` and `usersPipe` into a `joinPipe`, selected fields travel further through `retainPipe` to a `cdistPipe`. From this last pipe (as specified in `.addTailSink( cdistPipe, outputTap )`) resulting data goes into the Sink, which is our output folder.

The compiled code is executed via the hadoop command:

{% highlight bash %}
hadoop jar target/java-cascading-1.0-SNAPSHOT.jar LocationsNumForAProduct /path/to/input /path/to/output
{% endhighlight %}

The result on our data is:

{% highlight bash %}
1 3
2 1
{% endhighlight %}

## Testing

The Cascading API includes [test functionality][16], in particular [`cascading.CascadingTestCase`][18] and [`cascading.PlatformTestCase`][19] classes that allow the testing of custom Operations and Flows. Our example consists of one Flow. The Cascading API suggests using the `validateLength()` static helper methods from `cascading.CascadingTestCase` class for Flow testing. Different `validateLength()` methods validate that a Flow is of the correct length, has the correct Tuple size, and its values match a given regular expression pattern. In our example we can check that the final output has exactly two rows.

A fully working unit test for this code using these libraries is included in the [the github repository][12].

## Thoughts

Cascading simplifies data processing in comparison to using plain MapReduce by providing a higher level abstraction. The code is in Java and can easily be a small block of a bigger java project.

Cascading pipes provide an ability to easily write functions for data cleaning, matching, splitting, etc. Sitting somewhere in between raw Map Reduce and a higher level language like Hive, Cascading provides a relatively quick way to build data processing pipelines in a small(ish) amount of time.

## Cascading Resources

* [Cascading web-site][2]
* [*Enterprise Data Workflows with Cascading*][13] by Paco Nathan from O’Reilly Media
  * Check out [the review of the book][15] on the [Cascading web-site][2].


[1]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]: http://www.cascading.org/
[3]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[4]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[5]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[6]: /2013/04/07/real-world-hadoop---implementing-a-left-outer-join-in-pig.html
[7]: https://github.com/rathboma/hadoop-framework-examples/blob/master/cascading/src/main/java/com/matthewrathbone/example/LocationsNumForAProduct.java
[8]: http://www.cascading.org/sdk/
[9]: http://docs.cascading.org/cascading/2.7/userguide/htmlsingle/#N2087A
[10]: http://docs.cascading.org/cascading/2.7/userguide/htmlsingle/#N2024D
[11]: http://docs.cascading.org/cascading/2.7/userguide/htmlsingle/#N20AFD
[12]: https://github.com/rathboma/hadoop-framework-examples/blob/master/cascading
[13]: http://www.amazon.com/dp/1449358721?tag=matratsblo-20
[14]: http://shop.oreilly.com/product/0636920028536.do
[15]: http://www.cascading.org/2013/07/16/concurrent-inc-and-oreilly-media-unveil-enterprise-data-workflows-with-cascading-book/
[16]: http://docs.cascading.org/cascading/2.7/userguide/htmlsingle/#N21D75
[17]: http://docs.cascading.org/cascading/2.7/userguide/htmlsingle/#N20C99
[18]: http://docs.cascading.org/cascading/2.7/javadoc/cascading-core/
[19]: http://docs.cascading.org/cascading/2.7/javadoc/cascading-platform/

