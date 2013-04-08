---

title: Real World Hadoop - Implementing a Left Outer Join in Pig
layout: post
description: How to use Pig to perform a left outer join. Includes a comparison with Hive and regular Java Map Reduce.
subject: hadoop
tags:
- pig
- apache
- mapreduce
- left outer join

---

This article is part of [my guide to map reduce frameworks][1], in which I implement a solution to a real-world problem in each of the most popular Hadoop frameworks.

## The Problem

Let me quickly restate the problem from [my original article][2].

I have two datasets:

1. User information (id, email, language, location)
2. Transaction information (transaction-id, product-id, user-id, purchase-amount, item-description)

Given these datasets, I want to find the number of unique locations in which each product has been sold. To do that, I need to join the two datasets together.

I previously implemented a solution to this problem using [the standard map-reduce api in Java][3], and [Hive][4]. It took ~500 lines of code in Java, and many many hours of my spare time.

## The Pig Solution

[Apache Pig][5] is a framework for analyzing datasets that consists of a high-level scripting language (called Pig Latin), and infrastructure for compiling these scripts into a graph of Map Reduce jobs.
 Pig Latin is designed specifically for parallel data manipulation, is pretty easy to learn, and is extensible through a set of fairly simple APIs.

### The Script

Unlike with [Hive][6], Pig does not require me to set up a centralized metastore of data sources and formats. Instead I specify the directory and the format in a `LOAD` statement unique to each script.

{% highlight bash %}

USERS = load 'data/users' using PigStorage('\t') as (id:int, email:chararray, language:chararray, location:chararray);

TRANSACTIONS = load 'data/transactions' using PigStorage('\t') as (id:int, product:int, user:int, purchase_amount:double, description:chararray);

A = JOIN TRANSACTIONS by user LEFT OUTER, USERS by id;

B = GROUP A by product;

C = FOREACH B {
  LOCS = DISTINCT A.location;
  GENERATE group, COUNT(LOCS) as location_count;
};

DUMP C;


{% endhighlight %}

Notice how (like a real programming languages) a Pig script is a sequence of individual statements, instead of a single giant function (like with SQL).

The `GROUP BY` leading into the second `FOREACH` is the most confusing part of the script, so let me explain that a little.

After I generate dataset C using `GROUP`. I end up with a dataset that looks like this:

`group:product, A: tuple(id, email, location, etc)`

The field that you group on is renamed to 'group', and the remaining fields are part of a struct, named A (which is the name of the parent dataset before the group).

The nice thing about pig is that you can inspect the format of a dataset in between any statement:

{% highlight bash %}

grunt> DESCRIBE B;

B: {group: int,A: {(TRANSACTIONS::id: int,TRANSACTIONS::product: int,TRANSACTIONS::user: int,TRANSACTIONS::purchase_amount: double,TRANSACTIONS::description: chararray,USERS::id: int,USERS::email: chararray,USERS::language: chararray,USERS::location: chararray)}}


{% endhighlight %}

The script then iterates over every grouped piece of data and finds a count of all distinct locations.

Note that no map-reduce jobs get executed until the script calls `DUMP`. To write the results to a file, we call `STORE`. For example to store the data in tab delimited format in a file called 'results':

`STORE C INTO 'results' USING PigStorage('\t');`

## Testing

In theory it is pretty trivial to test a pig script from Java in JUnit using [Pig Unit][7]. However, in reality pigunit is limited. 

Most strikingly, if you want to define your test data within your test, pigunit only allows you to test scripts with a single input, and a single output, which is somewhat unrealistic. 

To run more complex scripts it is necessary to parameterize your scripts, then pass in the source paths as arguments.


Finally, for whatever reason, Apache does not publish a pig-unit jar to any public maven repository, but thankfully, [Cloudera][12] publish the PigUnit jar to their repository as part of their CDH releases, as we're using this repository already we don't really need to change anything. [Here it is for CDH4][11]

Both the pig script, and a JUnit test covering the script can be found in my [code example repository][14]. I had to modify to query to take arguments for input / output files:


{% highlight bash %}

USERS = load '$USERS' using PigStorage('\t') 
  as (id:int, email:chararray, language:chararray, location:chararray);

TRANSACTIONS = load '$TRANSACTIONS' using PigStorage('\t') 
  as (id:int, product:int, user:int, purchase_amount:double, description:chararray);

A = JOIN TRANSACTIONS by user LEFT OUTER, USERS by id;

B = GROUP A by product;

C = FOREACH B {
  LOCS = DISTINCT A.location;
  GENERATE group, COUNT(LOCS) as location_count;
};

STORE C INTO '$OUTPUT';

{% endhighlight %}

Here is the meat of the test code ([full code available here][14]):

{% highlight java %}

public class ScriptTest {
  // THIS DOES NOT WORK
  @Test
  public void test() throws Exception {
    // output is ignored by pigtest
    String[] args = new String[]{
      "OUTPUT=foo", 
      "USERS=src/test/resources/users.txt",
      "TRANSACTIONS=src/test/resources/transactions.txt"
    };
    String script = "src/main/pig/script.pig";
    
    
    PigTest test = new PigTest(script, args);
    String[] expectedOutput = {"(1,3)", "(2,1)"};
    test.assertOutput("C", expectedOutput);
  }
}


{% endhighlight %}

The alternative to parameterizing your pig script is to try and extend the functionality of pigunit to test more than one input programatically. [Clint Miller has some code examples on slideshare for this][13], but I was unable to get it working when I tried.


## Thoughts

Pig sits somewhere between SQL and Java in complexity and flexibility. You can write queries fairly quickly, but can also deploy and test them a little easier. It's really quick and easy to write a script, and importantly it is mostly simple to test.

I've also been working through the APIs for creating custom pig functions and loaders, and while it's not always exactly simple, it is a much easier task than creating Hive functions, so your options for extensibility are pretty good. Twitter has a set of libraries in their [Elephant Bird][15] project that can make this even easier.

## Pig Resources

- [Book: Programming Pig (by Alan Gates) on Amazon][8]
- [Official documentation on apache.org][5]
- [Introduction to Pig on SlideShare][9]
- [Practical Pig and Pig-Unit on SlideShare][10]
- [Possible pigunit testing with multiple inputs on slideshare][13]


[1]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
[2]: /2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html#walkthrough
[3]: /2013/02/09/real-world-hadoop-implementing-a-left-outer-join-in-hadoop-map-reduce.html
[4]: /2013/02/20/real-world-hadoop---implementing-a-left-outer-join-in-hive.html
[5]: http://pig.apache.org/
[6]: http://hive.apache.org/
[7]: http://pig.apache.org/docs/r0.8.1/pigunit.html
[8]: http://www.amazon.com/gp/product/1449302645/ref=as_li_qf_sp_asin_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=1449302645&linkCode=as2&tag=matratsblo-20
[9]: http://www.slideshare.net/jayshao/introduction-to-apache-pig
[10]: http://www.slideshare.net/SwissHUG/practical-pig-and-pig-unit-michael-noll-july-2012
[11]: https://repository.cloudera.com/artifactory/cloudera-repos/org/apache/pig/pigunit/
[12]: http://www.cloudera.com/content/cloudera/en/home.html
[13]: http://www.slideshare.net/clintmiller1/unit-testing-pig
[14]: https://github.com/rathboma/hadoop-framework-examples
[15]: https://github.com/kevinweil/elephant-bird