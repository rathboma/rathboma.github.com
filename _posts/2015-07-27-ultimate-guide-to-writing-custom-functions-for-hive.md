---
layout: post
title: "Apache Hive Customization Tutorial Series"
date: 2015-07-27T16:44:12-05:00
description: "How to implement all sorts of custom functions for hive, including complex functions like 'sum()', 'count()', and 'explode()'"
subject: hadoop
layout: post
tags:
- hive
- hadoop
- udf
- udtf
- udaf
- java
---

[Apache Hive][hive] is a SQL-on-Hadoop framework that levereges both [MapReduce][mapreduce] and [Tez][tez] to execute queries. It is possible to extend hive with your own code. Hive has a very flexible API, so you can write code to do a whole bunch of things, unfortunately the flexibility comes at the expense of complexity.

There are three types of *function* APIs in Hive, UDF, UDTF, and UDAF which all do very different things. Only by having a solid grasp of all of them will you truly be able to bend Hive to your will. Below are links to tutorials for each function type.

## Hive Tutorials


### Normal Functions (UDF)

Normal functions take inputs from a single row, and output a single value. Examples of [built-in functions](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inFunctions) include `unix_timestamp()`, `round()`, and `cos()`


<a href="/2013/08/10/guide-to-writing-hive-udfs.html" class="btn btn-info">Click here for my UDF tutorial</a>


### Table Functions (UDTF)

Table functions are similar to UDF functions, but they can output both multiple columns AND multiple rows of data (which is pretty nifty). Examples of [built-in table functions](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inTable-GeneratingFunctions(UDTF)) include `explode()`, `json_tuple()`, and `inline()`


<a href="http://beekeeperdata.com/posts/hadoop/2015/07/26/Hive-UDTF-Tutorial.html" class="btn btn-success">Click here for my UDTF tutorial</a>

### Aggregate Functions (UDAF)

Aggregate functions can operate over an entire table at once to perform some sort of aggregation. This sounds confusing, but it's very useful in practice. Examples of [built-in aggregate functions](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inAggregateFunctions(UDAF)) include `sum()`, `count()`, `min()`, and `histogram_numeric()`

<a href="#" class="btn btn-warning" disabled>Click here for my UDTF tutorial (coming soon!)</a>

[hive]:https://hive.apache.org/
[mapreduce]:http://hadoop.apache.org/docs/r1.2.1/mapred_tutorial.html
[tez]:https://tez.apache.org/
[beekeeper]: http://beekeeperdata.com


