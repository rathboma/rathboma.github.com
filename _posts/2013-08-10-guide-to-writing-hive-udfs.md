---
title: Hadoop Hive UDF Tutorial - Extending Hive with Custom Functions
layout: post
description: a walk-through (with code) of writing user defined functions (UDFs) for Apache Hive. There are two APIs, so my walkthrough will include examples for both.
subject: hadoop
tags:
- hive
- udf
- hadoop
- api
- extending hive
---

> This is part 1/3 in my [tutorial series for extending Apache Hive](/2015/07/27/ultimate-guide-to-writing-custom-functions-for-hive.html). 
> 
> * [Overview](http://blog.matthewrathbone.com/2015/07/27/ultimate-guide-to-writing-custom-functions-for-hive.html)
> * Article 1 - you're reading it!
> * [Article 2 - Guide to Table Functions (UDTF)](http://beekeeperdata.com/posts/hadoop/2015/07/26/Hive-UDTF-Tutorial.html)
> * [Article 3 - Guide to Aggregate Functions (UDAF)](http://beekeeperdata.com/posts/hadoop/2015/08/17/hive-udaf-tutorial.html)
> 

There are two different interfaces you can use for writing UDFs for Apache Hive. One is really simple, the other... not so much.

The simple API (`org.apache.hadoop.hive.ql.exec.UDF`) can be used so long as your function reads and returns primitive types. By this I mean basic Hadoop & Hive writable types - Text, IntWritable, LongWritable, DoubleWritable, etc.

However, if you plan on writing a UDF that can manipulate embedded data structures, such as `Map`, `List`, and `Set`, then you're stuck using `org.apache.hadoop.hive.ql.udf.generic.GenericUDF`, which is a little more involved.

- Simple API - [org.apache.hadoop.hive.ql.exec.UDF][simple-api]
- Complex API - [org.apache.hadoop.hive.ql.udf.generic.GenericUDF][complex-api]

I'm going to walk through an example of building a UDF in each interface. I will provide code and tests for everything I do.

If you want to browse the code, [fork it on Github][code].

## The Simple API

Building a UDF with the simpler UDF API involves little more than writing a class with one function (evaluate). Here is an example:

{% highlight java %}
class SimpleUDFExample extends UDF {
  
  public Text evaluate(Text input) {
    return new Text("Hello " + input.toString());
  }
}
{% endhighlight %}

[(full code available here)][code]

### Testing a simple UDF

Because the UDF is simple one function, you can test it with regular testing tools, like [JUnit][junit].

{% highlight java %}
public class SimpleUDFExampleTest {
  
  @Test
  public void testUDF() {
    SimpleUDFExample example = new SimpleUDFExample();
    Assert.assertEquals("Hello world", example.evaluate(new Text("world")).toString());
  }
}
{% endhighlight %}

#### Gotcha! Also Test in the Hive Console

You should also test the UDF in hive directly, especially if you're not totally sure that the function deals with the right types. 

{% highlight bash %}
%> mvn assembly:single
%> hive
hive> ADD JAR target/hive-extensions-1.0-SNAPSHOT-jar-with-dependencies.jar;
hive> CREATE TEMPORARY FUNCTION helloworld as 'com.matthewrathbone.example.SimpleUDFExample';
hive> select helloworld(name) from people limit 1000;
{% endhighlight %}

In fact, this UDF has a bug, it doesn't do a check for null arguments. Nulls can be pretty common in big datasets, so plan appropriately.

In response, I added a simple null check to the function code -
{% highlight java %}
class SimpleUDFExample extends UDF {
  
  public Text evaluate(Text input) {
    if(input == null) return null;
    return new Text("Hello " + input.toString());
  }
}
{% endhighlight %}

And included a second test to verify it -

{% highlight java %}

@Test
public void testUDFNullCheck() {
  SimpleUDFExample example = new SimpleUDFExample();
  Assert.assertNull(example.evaluate(null));
}

{% endhighlight %}

Running the tests with `mvn test` confirms that everything passes.


## The Complex API

The `org.apache.hadoop.hive.ql.udf.generic.GenericUDF` API provides a way to write code for objects that are not writable types, for example - `struct`, `map` and `array` types.

This api requires you to manually manage [object inspectors][object-inspectors] for the function arguments, and verify the number and types of the arguments you receive. An object inspector provides a consistent interface for underlying object types so that different object implementations can all be accessed in a consistent way from within hive (eg you could implement a struct as a `Map` so long as you provide a corresponding object inspector.

The API requires you to implement three methods:

{% highlight java %}
// this is like the evaluate method of the simple API. It takes the actual arguments and returns the result
abstract Object evaluate(GenericUDF.DeferredObject[] arguments);

// Doesn't really matter, we can return anything, but should be a string representation of the function.
abstract String getDisplayString(String[] children);

// called once, before any evaluate() calls. You receive an array of object inspectors that represent the arguments of the function
// this is where you validate that the function is receiving the correct argument types, and the correct number of arguments.
abstract ObjectInspector initialize(ObjectInspector[] arguments);
{% endhighlight %}

This probably doesn't make any sense without an example, so lets jump into that.

### Example {#examples}

I'm going to walk through the creation of a function called `containsString` that takes two arguments:

- A list of Strings
- A String

and returns true/false on whether the list contains the string that we provide, for example:

{% highlight java %}
containsString(List("a", "b", "c"), "b"); // true

containsString(List("a", "b", "c"), "d"); // false
{% endhighlight %}

Unlike with the UDF api, the GenericUDF api requires a little more boilerplate.

{% highlight java %}

class ComplexUDFExample extends GenericUDF {

  ListObjectInspector listOI;
  StringObjectInspector elementOI;

  @Override
  public String getDisplayString(String[] arg0) {
    return "arrayContainsExample()"; // this should probably be better
  }

  @Override
  public ObjectInspector initialize(ObjectInspector[] arguments) throws UDFArgumentException {
    if (arguments.length != 2) {
      throw new UDFArgumentLengthException("arrayContainsExample only takes 2 arguments: List<T>, T");
    }
    // 1. Check we received the right object types.
    ObjectInspector a = arguments[0];
    ObjectInspector b = arguments[1];
    if (!(a instanceof ListObjectInspector) || !(b instanceof StringObjectInspector)) {
      throw new UDFArgumentException("first argument must be a list / array, second argument must be a string");
    }
    this.listOI = (ListObjectInspector) a;
    this.elementOI = (StringObjectInspector) b;
    
    // 2. Check that the list contains strings
    if(!(listOI.getListElementObjectInspector() instanceof StringObjectInspector)) {
      throw new UDFArgumentException("first argument must be a list of strings");
    }
    
    // the return type of our function is a boolean, so we provide the correct object inspector
    return PrimitiveObjectInspectorFactory.javaBooleanObjectInspector;
  }
  
  @Override
  public Object evaluate(DeferredObject[] arguments) throws HiveException {
    
    // get the list and string from the deferred objects using the object inspectors
    List<String> list = (List<String>) this.listOI.getList(arguments[0].get());
    String arg = elementOI.getPrimitiveJavaObject(arguments[1].get());
    
    // check for nulls
    if (list == null || arg == null) {
      return null;
    }
    
    // see if our list contains the value we need
    for(String s: list) {
      if (arg.equals(s)) return new Boolean(true);
    }
    return new Boolean(false);
  }
  
}

{% endhighlight %}

### Code walkthrough

The call pattern for a UDF is the following:

1. The UDF is initialized using a default constructor.
2. `udf.initialize()` is called with the array of object instructors for the udf arguments (ListObjectInstructor, StringObjectInstructor).
  - We check that we have the right number of arguments (2), and that they are the right types (as above).
  - We store the object instructors for use in `evaluate()` (listOI, elementOI).
  - We return an object inspector so Hive can read the result of the function (BooleanObjectInspector).
3. Evaluate is called for each row in your query with the arguments provided (eg evaluate(List("a", "b", "c"), "c")).
  - We extract the values using the stored object instructors.
  - We do our magic and return a value that aligns with the object inspector returned from initialize. (list.contains(elemement) ? true : false)

### Testing

The only complex part of testing the function is in the setup. Once the call order is clear, and we know how to build object instructors then it's pretty easy.

My test reflects the functional examples [provided earlier](#examples), with an additional null argument check.

{% highlight java %}

public class ComplexUDFExampleTest {
  
  @Test
  public void testComplexUDFReturnsCorrectValues() throws HiveException {
    
    // set up the models we need
    ComplexUDFExample example = new ComplexUDFExample();
    ObjectInspector stringOI = PrimitiveObjectInspectorFactory.javaStringObjectInspector;
    ObjectInspector listOI = ObjectInspectorFactory.getStandardListObjectInspector(stringOI);
    JavaBooleanObjectInspector resultInspector = (JavaBooleanObjectInspector) example.initialize(new ObjectInspector[]{listOI, stringOI});
    
    // create the actual UDF arguments
    List<String> list = new ArrayList<String>();
    list.add("a");
    list.add("b");
    list.add("c");
    
    // test our results
    
    // the value exists
    Object result = example.evaluate(new DeferredObject[]{new DeferredJavaObject(list), new DeferredJavaObject("a")});
    Assert.assertEquals(true, resultInspector.get(result));
    
    // the value doesn't exist
    Object result2 = example.evaluate(new DeferredObject[]{new DeferredJavaObject(list), new DeferredJavaObject("d")});
    Assert.assertEquals(false, resultInspector.get(result2));
    
    // arguments are null
    Object result3 = example.evaluate(new DeferredObject[]{new DeferredJavaObject(null), new DeferredJavaObject(null)});
    Assert.assertNull(result3);
  }
}

{% endhighlight %}

Again, all the code in this blogpost is [open source and on Github][code].

## Finishing Up

Hopefully this article has given you an idea of how to extend Hive with custom functions.

Although I ignored them in this article, there are also [User Defined Aggregation Functions (UDAF)][udaf] which allow the processing and aggregation of many rows in a single function.
If you're interested in learning more, there are a [few][case-study] [resources][adaltas] on-line on this topic which can help.



## Read More about Hive

<div class="row-fluid">
  <div class="span12">
    <a href="https://www.amazon.com/Programming-Hive-Warehouse-Language-Hadoop/dp/1449319335/ref=as_li_ss_il?ie=UTF8&qid=1483631002&sr=8-4&keywords=apache+hive&linkCode=li2&tag=matratsblo-20&linkId=19440b00340527c32fde447f14163a30" target="_blank">
      <img border="0" src="//ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=1449319335&Format=_SL160_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=matratsblo-20" class="book-img">
    </a>

    <h3>
      <a href="http://amzn.to/2hUSwLM">Programming Hive: Data Warehouse and Query Language for Hadoop</a>
    </h3>
    <p>Programming Hive contains brief tutorials and code samples for both UDFs and UDAFs. The examples are different to mine, so they should help in building your understanding.</p>

  </div>
</div>



[simple-api]:http://hive.apache.org/docs/r0.10.0/api/org/apache/hadoop/hive/ql/exec/UDF.html
[complex-api]:http://hive.apache.org/docs/r0.10.0/api/org/apache/hadoop/hive/ql/udf/generic/GenericUDF.html
[junit]:http://junit.org/
[code]:https://github.com/rathboma/hive-extension-examples
[object-inspectors]:http://hive.apache.org/docs/r0.10.0/api/org/apache/hadoop/hive/serde2/objectinspector/ObjectInspector.html
[udaf]:http://hive.apache.org/docs/r0.9.0/api/org/apache/hadoop/hive/ql/exec/UDAF.html
[adaltas]:http://www.adaltas.com/blog/2012/03/06/hive-udaf-map-conversion/
[case-study]:https://cwiki.apache.org/confluence/display/Hive/GenericUDAFCaseStudy
[book]:http://amzn.to/2hUSwLM