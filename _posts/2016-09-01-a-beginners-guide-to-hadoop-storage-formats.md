---
title: A Beginner's Guide to Hadoop Storage Formats (or File Formats)
subject: hadoop
description: I'll walk through what we mean when we talk about 'storage formats' or 'file formats' for Hadoop and give you some initial advice on what format to use and how.
layout: post
published: true
date: 2016-09-01
image:
  url: /img/file_formats.jpg
  author:
    name: Lisa Nottingham
    url: https://www.flickr.com/photos/lyssah/5539143302

---

> Note, I use 'File Format' and 'Storage Format' interchangably in this article.


If you've read my [beginners guide to Hadoop][beginners-guide] you should remember that an important part of the Hadoop ecosystem is HDFS, Hadoop's distributed file system. Like other file systems the format of the files you can store on HDFS is entirely up to you. For example, you can use HDFS to store cat memes in GIF format, text data in plain-text CSV format, or spreadsheets in XLS format. This is not specific to Hadoop, you can store these same files on your computer file system.

However unlike a regular file system, HDFS is best used in conjunction with a data processing toolchain like MapReduce or Spark. These processing systems typically (although not always) operate on some form of textual data like webpage content, server logs, or location data.

In this article I will talk about what file formats actually are, go through some common Hadoop file format features, and give a little advice on which format you should be using.

But before all that, a word of warning.


## Hadoop Noob? Stop Here

If you're just getting started with Hadoop, HDFS, Hive and wondering what file format you should be using to begin with, let me give you some advice.

Just use tab delimited files for your prototyping (and first production jobs). They're easy to debug (because you can read them), they are the default format of Hive, and they're easy to create and reason about.

Once you have a production MapReduce or Spark job regularly generating data come back and pick something better.

Tab delimited data looks like this:

```
user_1	Matthew Rathbone	Dallas, TX
user_2	Joe Bloggs	London, England
```

Ok, time to get to the guts of this.


## A Quick Overview of Storage Formats

A storage format is just a way to define how information is stored in a file. This is usually indicated by the extension of the file (informally at least).

For example images have several common storage formats, PNG, JPG, and GIF are commonly used. All three of those formats can store the same image, but [each has specific characteristics](http://stackoverflow.com/questions/2336522/png-vs-gif-vs-jpeg-vs-svg-when-best-to-use). For example JPG files tend to be smaller, but store a compressed version of the image that is of lower quality.

When dealing with Hadoop's filesystem not only do you have all of these traditional storage formats available to you (like you can store PNG and JPG images on HDFS if you like), but you also have some Hadoop-focused file formats to use for structured and unstructured data.

Some common storage formats for Hadoop include:

- Plain text storage (eg, CSV, TSV files)
- Sequence Files
- Avro
- Parquet


## Why Storage Formats are Important

A huge bottleneck for HDFS-enabled applications like MapReduce and Spark is the time it takes to find relevant data in a particular location and the time it takes to write the data back to another location. These issues are exacerbated with the difficulties managing large datasets, such as evolving schemas, or storage constraints. The various Hadoop file formats have evolved as a way to ease these issues across a number of use cases.

Choosing an appropriate file format can have some significant benefits:

1. Faster read times
2. Faster write times
3. Splittable files (so you don't need to read the whole file, just a part of it)
4. Schema evolution support (allowing you to change the fields in a dataset)
5. Advanced compression support (compress the files with a compression codec without sacrificing these features)

Some file formats are designed for general use (like MapReduce or Spark), others are designed for more specific use cases (like powering a database), and some are designed with specific data characteristics in mind. So there really is quite a lot of choice.


## Storage Formats and HDFS-enabled Apps

MapReduce, Spark, and Hive are three primary ways that you will interact with files stored on Hadoop. Each of these frameworks comes bundled with libraries that enable you to read and process files stored in many different formats.

In MapReduce file format support is provided by the `InputFormat` and `OutputFormat` classes. Here is an example configuration for a simple MapReduce job that reads and writes to text files:

{% highlight java%}

Job job = new Job(getConf());
...
job.setInputFormatClass(TextInputFormat.class);
job.setOutputFormatClass(TextOutputFormat.class);

{% endhighlight %}

You can implement your own `InputFormat` classes if you want to store data in your own custom format. For example at Foursquare we stored some data in [MongoDB's BSON](http://bsonspec.org/) format wrapped in a custom [Thrift model](https://thrift.apache.org/), sometimes written to a sequence file, sometimes stored in BSON format. To do this we needed [our own input format and record reader](https://github.com/rathboma/mongo-hdfs-export/tree/master/src/main/scala/com/foursquare/hadoop/io), which are now open source. This allowed us to directly access data generated from a MongoDB database dump, saving a lot of needless additional ETL.

Both Hive and Spark have similar mechanisms for reading and writing custom file formats which wrap the Hadoop `InputFormat` described above, so the `InputFormat` is truly the gateway to file formats on Hadoop.

### Workflow Changes Required

While you can easily swap the storage formats used in Hadoop it is not usually as simple as switching a couple of lines of code. Different storage formats are set up to provide different types of data to their consumers.

For example the `TextInputFormat` gives you a string that represents a single line of the file it reads, whereas the AVRO file format is designed to provide you with structured data that can be deserialized to a java object.

To illustrate, take a look at this example of a MapReduce map class from the AVRO documentation ( I simplified it a little ). Notice how the Map task transparently receives an instance of the `User` class?

{% highlight java %}

  public static class ColorCountMapper extends Mapper<AvroKey<User>, NullWritable, Text, IntWritable> {

    @Override
    public void map(AvroKey<User> key, NullWritable value, Context context) {

      CharSequence color = key.datum().getFavoriteColor();
      if (color == null) {
        color = "none";
      }

      context.write(new Text(color.toString()), new IntWritable(1));
    }
  }

{% endhighlight %}

Contrast that with how you'd accomplish it with a vanilla text input workflow:

{% highlight java %}


  public static class ColorCountMapper extends Mapper<LongWritable, Text, Text, IntWritable> {

    @Override
    public void map(LongWritable key, Text value, Context context) {

      String[] user = value.getString().split("\\n");

      String color = "none";

      if(user.length >= 2) {
        color = user[1];
      }
      context.write(new Text(color), new IntWritable(1));
    }
  }

{% endhighlight %}

For advanced InputFormat usage and if you want to learn more about how to standardize MapReduce inputs check out  the [`RecordReader`](https://hadoop.apache.org/docs/r2.4.1/api/org/apache/hadoop/mapreduce/RecordReader.html), which you can use in conjunction with a InputFormat to standardize inputs to Map and Reduce jobs.



## Common Storage Formats

There are many storage formats available but I'll just go through the major ones and talk about their various pros and cons.

### Text Files (e.g. CSV, TSV)
Simple text-based files are common in the non-Hadoop world, and they're super common in the Hadoop world too. Data is laid out in lines, with each line being a record. Lines are terminated by a newline character `\n` in the typical unix fashion.

Text-files are inherently splittable (just split on \n characters!), but if you want to compress them you'll have to use a file-level compression codec that support splitting, such as BZIP2

Because these files are just text files you can encode anything you like in a line of the file. One common example is to make each line a JSON document to add some structure. While this can waste space with needless column headers, it is a simple way to start using structured data in HDFS.

I've used this approach many times and it's a great stepping stone to more structured data formats.

### Sequence Files

> [Website](http://wiki.apache.org/hadoop/SequenceFile)
  
Sequence files were originally designed for MapReduce, so the integration is smooth. They encode a `key` and a `value` for each record and nothing more. Records are stored in a binary format that is smaller than a text-based format would be. Like text files, the format does not encode the structure of the keys and values, so if you make schema migrations they must be additive.

Sequence files by default use Hadoop's `Writable` interface in order to figure out how to serialize and deserialize classes to the file.

Typically if you need to store complex data in a sequence file you do so in the `value` part while encoding the id in the `key`.  The problem with this is that if you add or change fields in your `Writable` class it will not be backwards compatible with the data stored in the sequence file.

One benefit of sequence files is that they support block-level compression, so you can compress the contents of the file while also maintaining the ability to split the file into segments for multiple map tasks.

Sequence files are well supported across Hadoop and many other HDFS enabled projects, and I think represent the easiest next step away from text files.

### Avro Files

> [Website](https://avro.apache.org/)

Avro is an opinionated format which understands that data stored in HDFS is usually not a simple key/value combo like `Int/String`. The format encodes the schema of its contents directly in the file which allows you to store complex objects natively. 

Honestly, Avro is not really a file format, it's a file format plus a serialization and deserialization framework. With regular old sequence files you **can** store complex objects but you have to manage the process. Avro handles this complexity whilst providing other tools to help manage data over time.

Avro is a well thought out format which defines file data schemas in JSON (for interoperability), allows for schema evolutions (remove a column, add a column), and multiple serialization/deserialization use cases. It also supports block-level compression. For most Hadoop-based use cases Avro is a really good choice.


### Columnar File Formats (Parquet, RCFile)

> [Parquet Website](https://parquet.apache.org/)
> [RCFile Website](https://en.wikipedia.org/wiki/RCFile)

The latest hotness in file formats for Hadoop is *columnar file storage*. Basically this means that instead of just storing *rows* of data adjacent to one another you also store *column values* adjacent to each other. So datasets are partitioned both horizontally and vertically. This is particularly useful if your data processing framework just needs access to a subset of data that is stored on disk as it can access all values of a single column very quickly without reading whole records.

One huge benefit of columnar oriented file formats is that data in the same column tends to be compressed together which can yield some massive storage optimizations (as data in the same column tends to be similar).

If you're chopping and cutting up datasets regularly then these formats can be very beneficial to the speed of your application, but frankly if you have an application that usually needs entire rows of data then the columnar formats may actually be a detriment to performance due to the increased network activity required.

Overall these formats can drastically optimize workloads, especially for Hive and Spark which tend to just read segments of records rather than the whole thing (which is more common in MapReduce).

Of the two file formats I mention, Parquet seems to have the most community support and is the format I would use.


## Bonus: Compression Codecs

I'll touch on this in a later post but there are two ways you can compress data in Hadoop.

1. File-Level Compression
2. Block-Level Compression

File-level compression means you compress entire files regardless of the file format, the same way you would compress a file in Linux. Some of these formats are splittable (e.g. bzip2, or LZO if indexed).

So you'd end up with a file called `user-data.csv.gzip` for example.

Block-level compression is internal to the file format, so individual blocks of data within the file are compressed. This means that the file remains splittable even if you use a non-splittable compression codec like *Snappy*. However, this is only an option if the specific file format supports it.

So you'd still have a file called `user-data.sequence`, which would include a header noting the compression codec needed to read the remaining file contents.

If you're seriously thinking about file formats then you should use compression. Snappy is a great balance of speed and compression ratio, and I've used it with great success in the past. 

As I mentioned earlier, to start with just keep things simple -- use text files with GZIP compression (GZIP is natively supported by Hadoop out of the box).


## Wrap Up

Hopefully by now you've learned a little about what file formats actually are and why you would think of choosing a specific one. We've discussed the main characteristics of common file formats and talked a little about compression.

This is not an exhaustive guide, so if you want to learn more about the particular codecs I encourage you to visit their respective web pages.


[beginners-guide]:/2013/04/17/what-is-hadoop.html