---
title: Real World Hadoop -  Implementing a Left Outer Join in Map Reduce
description: A real-world hadoop map reduce example in which two datasets are joined together, requiring multiple computation stages, custom partitioning, sorting, and grouping.
subject: hadoop
layout: post
tags:
- map-reduce
- secondary sort
- hadoop
- integration testing
- hdfs
- java
- scala
---
<!--   
- reintroduction of the series of posts
- restate the problem (# locations a product is sold in)
- general description of solution
  - join two datasets (on user-id)
  - associate location with product
  - count # of distinct locations for each product
- explain the naive solution
  - explain that you get location out of order
  - you could read all into memory then extract location
  - its bad because # records could be ~1 billion, so your job would crash
- explain what the real solution needs to do
  - this requires custom grouper and comparator [diagrams of both]
- implementing the real solution
  - created my own tuple writable to have a composite key
  - created my own partition, sorter, grouper -->


This article is part of [my guide to map reduce frameworks][1], in which I implement a solution to a real-world problem in each of the most popular hadoop frameworks.

If you're impatient, you can find the code for the map-reduce implementation [on my github][5], otherwise, read on!

## The Problem

Let me quickly restate the problem from [my original article][2].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold.

## A Single Threaded Solution

1. For each transaction, look up the user record for the transaction's userId
2. Join the user records to each transaction
3. Create a mapping from productId to a list of locations
3. Count the number of distinct locations per productId.

Here's one way to do this using [Scala][3]:

{% highlight scala %}
case class User(id: Int, email: String, lang: String, location: String)
case class Transaction(id: Int, productId: Int, userId: Int, amount: Double, desc: String)

val users: List[User] = getUsers()
val transactions: List[Transaction] = getTransactions()

// make a map for O(1) location lookups from userId
// we're assuming all entries are unique
val userToLocationMap = users.map{u => (u.id, u.location)}.toMap

// if no location is found, we're using 'NA'
// end up with a list of Tuple(productId, location)
val joined = transactions.map{t => (t.productId, userToLocationMap.getOrElse(t.userId, "NA"))}

// get a list of distinct locations seen for each product id
// eg: "product1" -> List("US", "GB", ... )
val grouped: Map[Int, List[String]] = joined.groupBy(_._1).mapValues{vs => vs.map(_._2).distinct }

grouped.foreach{ case(product, locations) =>
  println("%s: %d".format(product, locations.size))
}
{% endhighlight %}

## The Map Reduce Solution

First off, the problem requires that we write a two stage map-reduce:

1. Join users onto transactions and emit a set of product-location pairs (one for each transaction)
2. For each product sold, count the # of distinct locations it was sold in


### Stage 1

We're basically building a [left outer join][loj] with map reduce.

![stage 1](/img/mr-join.png "mad drawing skillz")

- transaction map task outputs (K,V) with `K = userId`, and `V = productId`
- user map tasks outputs (K,V) with `K = userId`, and `V = location`
- reducer gets both user location and productId thus outputs (K,V) with `K = productId`, and `V = location`


### Stage 2

- map task is an identity mapper, outputs (K,V) with `K = productId` and `V = location`
- reducer counts the number of unique locations that it sees per productId, outputs (K,V), `K = productId`, and `V = # distinct locations`

While this sounds fairly simple, when it comes to implementation, there are a few problems with this workflow.


## Implementation

### The Naive Solution

Basically as described above. In stage 1 both map tasks key their outputs by userId. It is the reducer's job to match a user to his transactions.

However, the order in which values arrive to the reduce() method is unspecified, because sorting in hadoop is performed on a key-by-key basis, and all keys for a particular user are identical (they're all the same userId).

Given this, for the reducer in stage one to join the two datasets together it will have to read all values into memory, find the 1 value containing user location, then emit the remaining values along with it.

Doing reduce-side computation in this way defeats many benefits of using map reduce, as a non-trivial proportion of the dataset must fit into memory. The scalability of this naive algorithm hinges on having no single user with greater than N transactions, where `N = (#-records * size of record) / available heap-space`.

Stage 2 has similar issues. The reducer will receive a list of locations for each particular product, but if those locations are not sorted, it will need to maintain an in-memory data structure to filter out duplicates, and to create accurate results.

### The Scalable Solution

We do not want our reducer to scan through all values in order to find a location record. The easiest way to avoid this is to ensure that the first value in the iterator is the user's location.

Reflecting on the design of map reduce, remember that between map and reduce, three other things happen:

1. Partitioning -- this defines which reducer partition the record is assigned to
2. Sorting -- the order of the records in the partition, based on key.
3. Grouping -- whether record N+1 accompanies record N in the same call to the [reduce()][4] function. Again based on key.

Using these components in coordination with a composite-key, consisting of a primary, and a secondary key, we can perform partitioning and grouping on the *primary* key, yet be able to sort by the *secondary* key. This is called a secondary sort.

First we need a class to represent the composite key. In stage-1 this key would contain:
1. The primary key: userId (for partitioning, and grouping)
2. The secondary key: a single character (for sorting)

I called this class [TextTuple][7], it contains two values, left and right, both of type Text.

Our secondary sort is simple, as we just want user records to appear before transactions. A simple solution for stage-1 is to set the user-record secondary key to "a", and the transaction-record secondary key to "b". a comes before b, so user records will appear first.

[my implementation for partitioning, grouping and sorting][8] looks something like this:

{% highlight java %}
public class SecondarySort {

  // Partition only by UID
  public static class SSPartitioner extends Partitioner<TextTuple, Object> {
    @Override
    public int getPartition(TextTuple k, Object value, int partitions) {
      return (k.left.hashCode() & Integer.MAX_VALUE) % partitions;
    }
  }

  // Group only by UID
  public static class SSGroupComparator extends TTRawComparator  {

    @Override
    public int compare(TextTuple first, TextTuple second) {
      return first.left.compareTo(second.left);
    }
  }

  // But sort by UID and the sortCharacter
  // remember location has a sort character of 'a'
  // and product-id has a sort character of 'b'
  // so the first record will be the location record!
  public static class SSSortComparator extends TTRawComparator {

    @Override
    public int compare(TextTuple first, TextTuple second) {
      int lCompare = first.left.compareTo(second.left);
      if (lCompare == 0) return first.right.compareTo(second.right);
      else return lCompare;
    }
  }

}
{% endhighlight %}

Now I can be sure that 
* all keys with the same UserID are sent to the same partition
* all keys with the same userId are sent to the same call to reduce()
* user records will preceded transaction records.
* Furthermore, as user records are unique, only the first value in the iterator contains a location, all other records are transactions.

With these assertions, I can implement my minimal state reducer:

{% highlight java %}
// the first value is location
// if it's not, we don't have a user record, so we'll 
// record the location as UNKNOWN
public class JoinReducer extends Reducer<TextTuple, TextTuple, Text, Text> {

  Text location = new Text("UNKNOWN");
  @Override
  public void reduce(TextTuple key, Iterable<TextTuple> values, Context context) 
  throws java.io.IOException, InterruptedException {
    for (TextTuple value: values) {
      if (value.left.toString().equals("location")) {
        location = new Text(value.right);
        continue;
      }

      Text productId = value.right;
      context.write(productId, location);
    }
  }

}
{% endhighlight %}


The same logic applies to stage-2. If my primary key is productId, and my secondary key is location, I can **group** records by productId, then **sort** by location. This again ensures that my reducer does not need to maintain state.

{% highlight java %}

public static class SecondReducer extends Reducer<TextTuple, Text, Text, LongWritable> {

  LongWritable valueOut = new LongWritable();

  @Override
  public void reduce(TextTuple product, Iterable<Text> locations, Context context)
  throws java.io.IOException, InterruptedException {
    String previous = null;
    long totalLocations = 0;
    for (Text location: locations) {
      if (previous == null || !location.toString().equals(previous)) {
        totalLocations += 1;
        previous = location.toString();
      }
    }
    valueOut.set(totalLocations);
    context.write(product.left, valueOut);
  }
}
{% endhighlight %}

The full implementation [is available on github][5].

I cannot stress enough the importance of testing your map reduce jobs, but that is a separate topic in itself. In the mean time, I urge you to check out the accompanying [integration test][it].

## Thoughts

- The amount of boiler plate code required to chain two map reduce jobs together is staggering. CLOC reports that I've written 400 lines of code to implement this.
- How you implement a left outer join is unintuitive, as are some of the api details ( eg sorting an grouping can only operate on keys, not values)
- Honestly whenever I have to join datasets in real life I go straight to higher level frameworks.

If you're interested in seeing how to solve the same problem using other map reduce frameworks, check back with [my guide to map-reduce frameworks][1] over the coming weeks. My goal is to create an example for every framework listed.



[1]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[3]: http://www.scala-lang.org/
[4]: http://hadoop.apache.org/docs/r0.20.2/api/org/apache/hadoop/mapred/Reducer.html#reduce(K2, java.util.Iterator, org.apache.hadoop.mapred.OutputCollector, org.apache.hadoop.mapred.Reporter)
[5]: https://github.com/rathboma/hadoop-framework-examples/tree/master/java-mapreduce
[6]: http://hadoop.apache.org/docs/r0.20.2/api/org/apache/hadoop/io/Writable.html
[7]: https://github.com/rathboma/hadoop-framework-examples/blob/master/java-mapreduce/src/main/java/com/matthewrathbone/example/TextTuple.java
[8]: https://github.com/rathboma/hadoop-framework-examples/blob/master/java-mapreduce/src/main/java/com/matthewrathbone/example/SecondarySort.java
[loj]: http://en.wikipedia.org/wiki/Join_(SQL)#Left_outer_join
[it]: https://github.com/rathboma/hadoop-framework-examples/blob/master/java-mapreduce/src/test/java/com/matthewrathbone/example/AppTest.java-mapreduce