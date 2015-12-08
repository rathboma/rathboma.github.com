---
title: Apache Hive vs MySQL - What are the key differences?
date: 2015-12-08
subject: hadoop
description: Apache Hive differs significantly from traditional relational databases like MySQL. I'll walk through some key differences in architecture and use cases to give a sense of when and why to use each technology.
layout: post
published: false
image:
  url: /img/mysql-hive.jpg
  author:
    url: https://www.flickr.com/photos/30949208@N06/2990410235
    name: Studio Roosegaarde

---

If you've read "[A Beginner's Guide to
Hadoop](http://blog.matthewrathbone.com/2013/04/17/what-is-hadoop.html),"
you have an idea of what Hadoop is and how it works. But Hadoop is really
just the foundation for a big data platform -- there are a number of
tools that work with Hadoop to enhance and build upon the core platform.
One such technology is Apache Hive.

A project of the [Apache Software Foundation](https://hive.apache.org/),
Apache Hive is a query engine that acts as an interface
into Hadoop MapReduce (among other execution engines like Tez). With hive it is possible to perform data analysis on large datasets via SQL, 
or rather HiveQL, which is very similar. A primary purpose of Apache Hive is to allow users to structure and
query data to obtain useful analytics.

MySQL, for its part, is an open-source relational database platform. MySQL forms the database foundation of
a LAMP (Linux-Apache-MySQL-PHP) stack for web and application
development, but can also be very useful as a database for analytics.

Hive's Basic Architecture
-------------------------

As an overview, the major architectural components of Hive include the
following:

-   **Hadoop Distributed File System (HDFS):** Hive uses the Hadoop HDFS
    system for storage.
-   **MapReduce / YARN:** As part of the Hadoop umbrella of projects, Hive uses MapReduce for
    parallel processing functions. It can also use [Tez](https://tez.apache.org/)
-   **Hive Driver / Compiler:** The Hive Driver executes HiveQL queries which are
    parsed by the compiler to generate an execution plan by
    examining both the query blocks and expressions. The query is also compared
    against the metadata from the metastore to make sure it is valid. The resulting execution plan
    is executed on the Hadoop cluster via MapReduce or Tez.
-   **Hive Thrift Server:** Clients access Hive via the Hive Thrift
    Server, which allows any JDBC or ODBC-compliant application to
    access Hive. Along with programming language bindings for languages like PHP and Python a
    command line interface is also available.
-   **Hive Metastore:** The metastore contains information about the
    partitions and tables in the warehouse, data necessary to perform
    read and write functions, and HDFS file and data locations.

You can find a full explanation of the Hive architecture on the [Apache
Wiki](https://cwiki.apache.org/confluence/display/Hive/Design).

Hive vs. MySQL
--------------

While each tool performs a similar general action, retrieving data, each
does it in a very different way. Whereas Hive is intended as a
convenience/interface for querying data stored in HDFS, MySQL is
intended for online operations requiring many reads and writes.

One good example of this difference in action is in forming table schemas. Hive uses a method of querying data known as "schema on
read," which allows a user to redefine tables to match the data without touching the data. 
Hive has serialization and deserialization adapters to let the user do this, so it isn't intended for online tasks requiring heavy read/write
traffic. On the flip side, MySQL utilizes "schema on write", which means you define table schemas *before* 
you can add data to the store. This allows MySQL to store it in an optimal way for fast reading and writing. These differing
approaches are a good example of how these two technologies differ. You can read more about schema on read vs schema on write on the
[Marklogic
blog](http://www.marklogic.com/blog/schema-on-read-vs-schema-on-write/).

### When to Use Hive

-   **If you have large (think terabytes/petabytes) datasets to query:** Hive is
    designed specifically for analytics on large datasets and works well
    for a range of complex queries. Hive is the most approachable way to quickly (relatively)
    query and inspect datasets already stored in Hadoop.
-   **If extensibility is important:** Hive has a range of user function APIs that can be used to build
    custom behavior in to the query engine. Check out my [guide to Hive functions](http://blog.matthewrathbone.com/2015/07/27/ultimate-guide-to-writing-custom-functions-for-hive.html) 
    if you'd like to learn more.

### When to Use MySQL

-   **If performance is key:** If you need to pull data frequently and
    quickly, such as to support an application that uses online
    analytical processing (OLAP), MySQL performs much better. Hive isn't
    designed to be an online transactional platform, and thus performs
    much more slowly than MySQL.
-   **If your datasets are relatively small (gigabytes):** Hive works very well in
    large datasets, but MySQL performs much better with
    smaller datasets and can be optimized in a range of ways.
-   **If you need to update and modify a large number of records
    frequently:** MySQL does this kind of activity all day long. Hive,
    on the other hand, doesn't really do this well (or at
    all, depending). And if you need an interactive experience, use
    MySQL.

Through this summary of the differences between Hive and MySQL, I hope
I've helped provide some direction on which platform to use in different
applications and environments. For additional points of comparison,
[check out this post on the Hadoop Tutorial website](http://hadooptutorial.info/hive-vs-rdbms/).



