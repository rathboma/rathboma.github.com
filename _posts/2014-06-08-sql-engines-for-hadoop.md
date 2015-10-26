---
title: "8 SQL-on-Hadoop frameworks worth checking out"
layout: post
description: "A rundown of the common query engines for Hadoop, with some of their pros/cons"
subject: hadoop
tags: 
  - Hadoop
  - hive
  - impala
  - shark
  - Hawq
published: true
---


The language of data is SQL, so naturally lots of tools have been developed to bring SQL to Hadoop. They range from simple wrappers on top of *Map Reduce* to full data warehouse implementations built on top of HDFS and everywhere in between.

There are more tools than you might think, so this is my attempt at listing them all and hopefully providing some insight into what each of them actually does.

I've tried to order them based on 'installation friction', so the more complex products are towards the bottom.

I'll cover the following technologies:

- [Apache Hive](#apache-hivehive)
- [Impala](#cloudera-impalaimpala)
- [Presto (Facebook)](#presto-by-facebookpresto)
- [Shark](#sharkshark)
- [Apache Drill](#apache-drilldrill)
- [EMC/Pivotal HAWQ](#hawqhawq)
- [BigSQL by IBM](#bigsql-by-ibmbigsql)
- [Apache Pheonix (for HBase)](#apache-phoenixphoenix)
- [Apache Tajo](#apache-tajotajo)



## [Apache Hive][hive]

[![hive](/img/hive.jpg)][hive]

Hive is the original SQL-on-Hadoop solution.

Hive is an open-source Java project which converts SQL to a series of Map-Reduce jobs which run on standard Hadoop tasktrackers. It tries to look like MySQL by using a metastore (itself a database) to store table schemas, partitions, and locations. It largely supports MySQL syntax and organizes datasets using familiar `database/table/view` conventions. Hive provides:

- A SQL-like query interface called Hive-QL, loosely modelled after MySQL
- A command line client
- Metadata sharing via a central service
- JDBC drivers
- Multi-language [Apache Thrift][thrift] drivers
- A Java API for creating custom functions and transformations


### Should you use it?

Hive is considered one of the de-facto tools installed on almost all Hadoop installations. It's simple to set up and doesn't require much infrastructure to get started with. Given the small cost of use, there's pretty much no reason to not try it.

That said, queries performed with Hive are usually very slow because of the overhead associated with using Map-Reduce.

### The future of Hive

[Hortonworks][hortonworks] has been pushing the development of [Apache Tez][tez] as a new back-end for Hive to provide fast response times currently unachievable using Map Reduce.

### Hive Tutorial Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/Pn7Sp2-hUXE" frameborder="0" allowfullscreen></iframe>


## [Cloudera Impala][impala]

[![impala](/img/impala.png)][impala]

Impala is an open-source 'interactive' SQL query engine for Hadoop. It's build by [Cloudera][cloudera], one of the largest Hadoop vendors in the market. Like Hive, it provides a way to write SQL queries against your existing Hadoop data. Unlike Hive, it does not use Map-Reduce to execute the queries, but instead uses it's own set of execution daemons which need to be installed alongside your datanodes. It provides:

- ANSI-92 SQL syntax support
- HIVE-QL support
- A command line client
- ODBC drivers
- Interop with the Hive Metastore for schema sharing across platforms
- A C++ api for creating functions and transformations


### Should you use it?

Impala is designed to complement the use of Apache Hive, so if you need faster access to your data than Hive can offer it might be a good choice, especially if you have a Cloudera, MapR or Amazon Hadoop cluster deployed. That said, to fully benefit from Impala's architecture you'll need to store your data in a particular file format ([Parquet](http://parquet.io/)), which can be a painful transition. Additionally, you'll need to install Impala deamons across your cluster which means taking some resources away from your Tasktrackers. Impala does not currently support YARN.


### The future of Impala

Cloudera has been prototyping Impala integration for YARN which could make the deployment of Impala much less painful for the next generation of Hadoop clusters.

### Impala Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/jg7l_rlhCJ8" frameborder="0" allowfullscreen></iframe>


## [Presto by Facebook][presto]

[![presto](/img/presto.png)][presto]

Presto is an open source 'interactive' SQL query engine for Hadoop written in Java. It's built by [Facebook][facebook], the original creators of Hive. Presto is similar in approach to Impala in that it is designed to provide an interactive experience whilst still using your existing datasets stored in Hadoop. It also requires installation across many 'nodes', again similar to Impala. It provides:

- ANSI-SQL syntax support (presumably ANSI-92)
- JDBC Drivers
- A set of 'connectors' used to read data from existing data sources. Connectors include: HDFS, Hive, and Cassandra.
- Interop with the Hive metastore for schema sharing


### Should you use it?

Presto targets the same goals as Cloudera's Impala. Unlike Impala, it is not supported by a major vendor, so if you need enterprise support for your installation you're out of luck. That said, it is in production use by some well-known and respected technology companies, so presumably there is somewhat of a community around it. Like Impala, performance is dependent on storing data in a particular format ([RCFile][rcfile]). Honestly I'd think carefully about your abilities to support and debug Presto before deploying it, if you're comfortable with those aspects of it, and you trust Facebook not to abandon the open source version of Presto then go for it.

### Presto Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/qZsfpK9bafY" frameborder="0" allowfullscreen></iframe>


## [Shark][shark]

[![shark](/img/shark.png)][shark]

Shark is an open source SQL query engine written in Scala by UC Berkeley. Like Impala and Presto, it is designed to complement an existing Hive installation, and executes queries on it's own set of worker nodes instead of using Map-Reduce. Unlike Impala and Presto, Shark is built on top of an existing data processing engine called [Apache Spark][spark]. Spark is very popular right now, and is starting to build quite a large community. Think of Spark as a faster alternative to Map-Reduce. Shark provides:

- SQL-like query language supporting [most of Hive-QL](https://github.com/amplab/shark/wiki/Compatibility-with-Apache-Hive)
- A command line client (basically the Hive client)
- Interoperability with the Hive metastore for schema sharing
- Support for existing Hive extensions such as UDFs and SerDes

### Should you use it?

Shark is interesting because it aims to support the entirity of Hive functionality whilst also trying to offer massive performance improvements. That said, while a lot of organizations are using [Spark][spark], I'm not sure how many are using Shark. I don't think it provides the same sort of performance improvements offered by Presto and Impala, but if you already plan on using Spark it seems like a no-brainer to at least try it, especially as Spark is being supported by a lot of major vendors.

### Shark Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/N3ITxQcf6uQ" frameborder="0" allowfullscreen></iframe>


## [Apache Drill][drill]

[![drill](/img/drill.png)][drill]

Oh boy, another one. Apache Drill is an open-source 'interactive' SQL query engine for Hadoop. It is being pushed by [MapR](http://www.mapr.com/), although they are also now supporting Impala. Apache Drill has similar goals to Impala and Presto -- fast interactive queries for large datasets, and like these technologies it also requires installation of worker nodes (drillbits). However, unlike Impala and Presto, Drill aims to support multiple backing stores (HDFS, HBase, MongoDB), and has a focus on complex nested datasets (like JSON). I'm unsure how widely used Drill is. Drill Provides:

- ANSI compliant SQL
- Interoperability with several back-end datastores and metadata-stores (Hive, HBase, MongoDB)
- Extension framework for UDFs, storage plugins, 

### Should you use it?

The project is out of alpha (version 1.2 as of October 2015), so it's certainly becoming more stable as time progresses. It should be fairly easy to test with your Hadoop distribution, I'm just not sure if it will ever become the industry standard.

### Apache Drill Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/p__e4hmY1II" frameborder="0" allowfullscreen></iframe>


## [HAWQ][hawq]

[![hawq](/img/hawq.jpg)][hawq]

Now things start to get complicated.

Hawq is a closed-source product from [EMC Pivotal](http://www.gopivotal.com/) offered as part of 'Pivotal HD' their proprietary distribution of Hadoop. Pivotal claim that Hawq is the 'worlds fastest SQL engine on Hadoop' and that it has been in development for 10 years. However such claims are hard to substantiate. It's hard to work out exactly what features Hawq provides, but I could glean the following:

- Full SQL syntax support
- Interoperability with Hive and HBase through the *Pivotal Xtension Framework* (PXF)
- Interoperability with Pivotal's GemFire XD, their in-memory real-time database backed by HDFS

### Update - October 2015
Early in 2015 Pivotal actually open sourced a bunch of their stack, this includes now named [Apache Hawq](http://hawq.incubator.apache.org/). Pivotal also partnered with Hortonworks, so Hawq is available on the HDP stack and can be managed by Ambari.

### Should you use it?

Now Hawq is open source, it may be worth trying out. Although of note is that neither HDP or CDH ship with Hawq packages right now (October 2015), so you'll have to get it working yourself.

### HAWQ Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/c76cmcPYIQE" frameborder="0" allowfullscreen></iframe>

## [BigSQL by IBM][bigsql]

[![ibm](/img/ibm.jpg)][bigsql]

[Big Blue](http://ibm.com) has their own Hadoop Distribution called [Big Insights][big-insights], BigSQL is offered as part of that distribution. BigSQL is used to query data stored in HDFS using both Map-Reduce and something else (unknown) which provides low latency results. From the documents I can access, BigSQL seems to provide:

- JDBC and ODBC drivers
- Broad SQL support
- Presumably a command line client

### Should you use it?

Again, if you're a customer of IBM then yes you should! Otherwise, probably not. :-)

### BigSQL Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/DCWig4-h1F4" frameborder="0" allowfullscreen></iframe>

## [Apache Phoenix][phoenix]

[![phoenix](/img/phoenix.png)][phoenix]

Apache Phoenix is an open-source SQL engine for [Apache HBase][hbase]. The goal of Phoenix is to provide low-latency queries for data stored in HBase via an embeddable JDBC driver. Unlike the other engines we've been exploring, Phoenix offers both read and write operations on HBase data. It provides:

- a JDBC driver
- a command-line client
- facilities for bulk-loading data
- the ability to create new tables, or map to existing HBase data

### Should you use it?

If you use HBase there's no reason not to. Although Hive has the ability to read data from HBase, Phoenix also allows you to write data. It's unclear whether it is appropriate for production, transactional use, but it's certainly powerful enough as an analytics tool.

### Phoenix Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/9qfBnFyKZwM" frameborder="0" allowfullscreen></iframe>


## [Apache Tajo][tajo]

[![tajo](/img/tajo.png)][tajo]


Apache Tajo is a project to build an advanced data warehousing system on top of HDFS. From my understanding Tajo bills itself as a 'big data warehouse', but it seems similar to the other low-latency query engines I've already covered. While it has support for external tables and Hive datasets (via [HCatalog](http://hortonworks.com/hadoop/hcatalog/)) it's focus in on managing the data, providing low-latency access to the data, and providing tools for more traditional ETL. In similar fashion to Impala/Presto/etc it requires that you deploy Tajo-specific worker processes to your datanodes. Tajo provides:

- ANSI SQL compliance
- JDBC Drivers
- Hive metastore integration for access to Hive datasets
- A command line client
- An API for custom functions.

### Should you use it?

While there are [some benchmarks](http://blogs.gartner.com/nick-heudecker/apache-tajo-enters-the-sql-on-hadoop-space/) that show promising results for Tajo, benchmarks are inherently biased and shouldn't be fully trusted. The community side of Tajo seems pretty light, and there are no major Hadoop vendors in North America that support it. That said, if you're in South Korea [Gruter](http://www.gruter.com/) is the primary project sponsor and would be a good source of support if you're on their platform.
Overall, if you're not working with Gruter, it's a hard sell over more well-known query engines such as Impala or Presto.

### Tajo Video

<iframe width="100%" height="315" src="//www.youtube.com/embed/m8THYeA8R7Q" frameborder="0" allowfullscreen></iframe>

[bigsql]: http://pic.dhe.ibm.com/infocenter/pdsh/v1r0m0/index.jsp?topic=%2Fcom.ibm.swg.im.infosphere.biginsights.welcome.doc%2Fdoc%2Fwelcome.html
[infinidb]: http://www.infinidb.co/
[tajo]: http://tajo.apache.org
[phoenix]: http://phoenix.apache.org/
[drill]: http://incubator.apache.org/drill/
[big-insights]: http://pic.dhe.ibm.com/infocenter/pdsh/v1r0m0/index.jsp?topic=%2Fcom.ibm.swg.im.infosphere.biginsights.welcome.doc%2Fdoc%2Fwelcome.html
[hawq]: http://www.gopivotal.com/big-data/pivotal-hd
[spark]: http://spark.apache.org/
[shark]: http://shark.cs.berkeley.edu/
[presto]: http://prestodb.io
[facebook]: http://facebook.com
[hive]: https://hive.apache.org/
[thrift]: https://thrift.apache.org/
[impala]: http://www.cloudera.com/content/cloudera/en/products-and-services/cdh/impala.html
[cloudera]: http://cloudera.com
[hortonworks]: http://hortonworks.com
[tez]: http://tez.incubator.apache.org/
[rcfile]: https://en.wikipedia.org/wiki/RCFile
[hbase]: http://hbase.apache.org
