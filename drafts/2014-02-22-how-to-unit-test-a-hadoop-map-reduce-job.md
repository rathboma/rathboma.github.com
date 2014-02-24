---
title: Integration testing Hadoop Map Reduce Jobs with Hadoop Test Helper
layout: post
description: A new open source library for testing Map Reduce pipelines.
subject: hadoop
tags:
- hadoop
- testing
- unit testing
- integration testing
---

If you're testing your map reduce job then [MRUnit](http://mrunit.apache.org/) is a great way to unit test individual mappers and reducers.

However, over time you'll undoubtably end up with fairly complex map reduce pipelines for which MRUnit is just not comprehensive enough on it's own.

Some situations in which you might want an end-to-end testing framework:
- your pipeline consists of several map reduce jobs.
- you implemented your own partitioner / grouper / comparator.
- you perform some tasks in your `main` method before or after the actual map reduce job.
- you have your own input/output formats or record readers, and you want to see how they all interact.

Now you might really want to write an end-to-end test, but how without interacting with a real Hadoop cluster?

It is for this reason that I would like to announce a small library for both Java and Scala that solves this problem (and several more).

## Announcing the Hadoop Test Helper

The [Hadoop Test Helper](https://github.com/rathboma/hadoop-testhelper#inspiration) (HTH), and [Scala Hadoop Test Helper](foo) libraries let you write unit-tests for Hadoop pipelines using only the local file system, and without the need for a running Hadoop cluster.

**Let me make this clear** - using this library you can write, and test, your map reduce jobs front-to-back without a Hadoop cluster.

I've been using HTH for a while and it has dramatically reduced my development/testing iteration cycle - there is no need to build a jar and run `hadoop jar` over and over and over.

It is also simple to use, and very flexible. A basic test workflow is:
- create some test input data
- get some `Path` objects for your output locations
- run your `main` method
- read the outputs and assert the results

### Java Example

{% highlight java %}
import com.matthewrathbone.hadoop.MRTester;
import com.matthewrathbone.hadoop.MRTester.*;

private String testInput = "1,2,3\n1,2,3\n1,2,3";

public void testMyHadoopJob() {
  MRTester tester = new MRTester();
  TestJob job = new TestJob() {
    @Override
    public void run(JobArgs args) throws Exception {

      // the tester can provide you with some directories to use.
      Path inputDirectory = tester.registerString(testInput);
      Path outputDirectory = tester.registerDirectory();

      // run your mapreduce pipeline
      // I always add a second main method that takes a Configuration object to override for testing.
      // the regular main just calls that with a new Configuration()
      MyMapReducePipeline.main(inputDirectory.toString(), outputDirectory.toString(), args.conf);

      // these are the outputs to our job, we can now assert results. It can read compressed files.
      List<String> results = runner.collectStrings(outputDirectory);
      Assert.assertEquals("number of results is correct", results.size(), 10);

      for(String result: results) {
        Assert.assertEquals("result is correct", result, "something");
      }

      // we also have access to the filesystem if we want to do other stuff:
      args.fs.listStatus(outputDirectory);
    }
  }

  // code gets executed here
  tester.run(job);
}
{% endhighlight %}

### Scala Example

{% highlight scala %}
import com.matthewrathbone.ScalaMRTester

val input = List("1,2,3", "1,2,3", "1,2,3").mkString("\n")

def testMyHadoopJob() {
  val tester = new ScalaMRTester()
  tester.run{ args =>
    val inputDirectory = tester.registerString(input)
    val outputDirectory = tester.registerDirectory()
    MyMapReducePipeline.main(inputDirectory, outputDirectory, args.conf)
    val results = runner.collectStrings(outputDirectory).asScala // using scalaj-collection
    results.foreach{ result =>
      Assert.assertEquals(result, "something")
    }
  }
}
{% endhighlight %}

### How it works

Firstly HTH sets a few options in the `Configuration` object that your job uses. These options make it safe for jobs to run in local mode.

Secondly, by only using `Path` objects that you obtain through the test runner it ensures that all input/output paths are on the local filesystem (by default all directories are located in `target/test`).

Lastly, HTH provides a set of convenience functions for interacting with input/output `Path`s, so it's really easy to check that your pipeline created the right data.

HTH stays out of your way, so it's easy to integrate into your existing unit tests. All of my examples use vanilla JUnit for asserting job results.

### Using HTH

To use HTH you need to make a slight modification to your map reduce launcher. Namely, you need a method that accepts a `org.apache.hadoop.conf.Configuration` object alongside your input / output paths.

I tend to do something like this:

{% highlight java %}

  public static void main( String[] args ) throws Exception {
    Path input = new Path(args[1]);
    Path output = new Path(args[3]);
    main(new Configuration(), input, output );
  }

  // this allows testing easier as I can pass in a configuration
  // object.
  public static void main(Configuration conf, Path input, Path output) 
  {
    // do your normal stuff here
    runJob(input, output);
  }

{% endhighlight %}

This way I can still launch the job from the command line, but I can also call the second `main` method from my test, passing in the test `Configuration`.
