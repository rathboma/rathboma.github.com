---
title: Hadoop Python MapReduce Tutorial for Beginners
layout: post
description: "A step-by-step tutorial for writing your first map reduce with Python and Hadoop Streaming."
subject: hadoop
tags: 
  - hadoop
  - python
  - big data
  - tutorial
  - hadoop streaming
  - nfl data
published: true
---


This article originally accompanied my tutorial session at the [Big Data Madison Meetup, November 2013][bdm].

The goal of this article is to:

- introduce you to the hadoop streaming library (the mechanism which allows us to run non-jvm code on hadoop)
- teach you how to write a simple map reduce pipeline in Python (single input, single output).
- teach you how to write a more complex pipeline in Python (multiple inputs, single output).

There are other good resouces online about Hadoop streaming, so I'm going over old ground a little. Here are some good links:

1. [Hadoop Streaming official Documentation](http://hadoop.apache.org/docs/r1.1.2/streaming.html)
2. [Michael Knoll's Python Streaming Tutorial](http://www.michael-noll.com/tutorials/writing-an-hadoop-mapreduce-program-in-python/)
3. [An Amazon EMR Python streaming tutorial](http://aws.amazon.com/articles/2294)

If you are new to Hadoop, you might want to check out [my beginners guide to Hadoop][beginners-guide] before digging in to any code (it's a quick read I promise!).

## Setup

I'm going to use the [Cloudera Quickstart VM][quickstart-vm] to run these examples.

Once you're booted into the quickstart VM we're going to get our dataset. I'm going to use the [play-by-play nfl data by Brian Burke][play-by-play]. To start with we're only going to use the data in his [Git repository][play-git].

Once you're in the cloudera VM, clone the repo:

{% highlight bash %}
cd ~/workspace
git clone https://github.com/eljefe6a/nfldata.git
{% endhighlight %}

To start we're going to use `stadiums.csv`. However this data was encoded in Windows (grr) so has `^M` line separators instead of new lines `\n`. We need to change the encoding before we can play with it:

{% highlight bash %}
cd workspace/nfldata
cat stadiums.csv # BAH! Everything is a single line
dos2unix -l -n stadiums.csv unixstadiums.csv
cat unixstadiums.csv # Hooray! One stadium per line
{% endhighlight %}

[play-git]:https://github.com/eljefe6a/nfldata

## Hadoop Streaming Intro

The way you ordinarily run a map-reduce is to write a java program with at least three parts.

1. A Main method which configures the job, and lauches it
    - set # reducers
    - set mapper and reducer classes
    - set partitioner
    - set other hadoop configurations
2. A Mapper Class
    - takes K,V inputs, writes K,V outputs
3. A Reducer Class
    - takes K, Iterator\[V\] inputs, and writes K,V outputs

Hadoop Streaming is actually just a java library that implements these things, but instead of actually doing anything, it pipes data to scripts. By doing so, it provides an API for other languages:

- read from STDIN
- write to STDOUT

Streaming has some (configurable) conventions that allow it to understand the data returned. Most importantly, it assumes that Keys and Values are separated by a `\t`. This is important for the rest of the map reduce pipeline to work properly (partitioning and sorting). To understand why [check out my intro to Hadoop][beginners-guide], where I discuss the pipeline in detail.

### Running a Basic Streaming Job

It's just like running a normal mapreduce job, except that you need to provide some information about what scripts you want to use.

Hadoop comes with the streaming jar in it's lib directory, so just find that to use it.
The job below counts the number of lines in our stadiums file. (This is really overkill, because there are only 32 records)

{% highlight bash %}

hadoop fs -mkdir nfldata/stadiums
hadoop fs -put ~/workspace/nfldata/unixstadiums.csv  nfldata/stadiums/

hadoop jar /usr/lib/hadoop-0.20-mapreduce/contrib/streaming/hadoop-streaming-2.0.0-mr1-cdh4.4.0.jar \
    -Dmapred.reduce.tasks=1 \
    -input nfldata/stadiums \
    -output nfldata/output1 \
    -mapper cat \
    -reducer "wc -l"

# now we check our results:
hadoop fs -ls nfldata/output1

# looks like files are there, lets get the result:
hadoop fs -text nfldata/output1/part*
# => 32
{% endhighlight %}

A good way to make sure your job has run properly is to look at the *jobtracker dashboard*. In the quickstart VM there is a link in the bookmarks bar.

You should see your job in the running/completed sections, clicking on it brings up a bunch of information. The most useful data on this page is under the `Map-Reduce Framework` section, in particular look for stuff like:

- Map Input Records
- Map Output Records
- Reduce Output Records

In our example, input records are 32 and output records is 1:

![jobtracker dashboard][dashboard-screenshot]


## A Simple Example in Python

Looking in columns.txt we can see that the stadium file has the following fields:

{% highlight bash %}

Stadium (String) - The name of the stadium
Capacity (Int) - The capacity of the stadium
ExpandedCapacity (Int) - The expanded capacity of the stadium
Location (String) - The location of the stadium
PlayingSurface (String) - The type of grass, etc that the stadium has
IsArtificial (Boolean) - Is the playing surface artificial
Team (String) - The name of the team that plays at the stadium
Opened (Int) - The year the stadium opened
WeatherStation (String) - The name of the weather station closest to the stadium
RoofType (Possible Values:None,Retractable,Dome) - The type of roof in the stadium
Elevation - The elevation of the stadium

{% endhighlight %}

Lets use map reduce to find the number of stadiums with artificial and natrual playing surfaces.

The pseudo-code looks like this:

{% highlight python %}
def map(line):
    fields = line.split(",")
    print(fields.isArtificial, 1)

def reduce(isArtificial, totals):
    print(isArtificial, sum(totals))

{% endhighlight %}

You can find the finished code in my [Hadoop framework examples repository](https://github.com/rathboma/hadoop-framework-examples).

### Important Gotcha!

The reducer interface for streaming is actually different than in Java. Instead of receiving `reduce(k, Iterator[V])`, your script is actually sent one line per value, including the key.

So for example, instead of receiving:
{% highlight python %}

reduce('TRUE', Iterator(1, 1, 1, 1))
reduce('FALSE', Iterator(1, 1, 1))

{% endhighlight %}

It will receive:
{% highlight python %}
TRUE 1
TRUE 1
TRUE 1
TRUE 1
FALSE 1
FALSE 1
FALSE 1
{% endhighlight %}

This means you have to do a little state tracking in your reducer. This will be demonstrated in the code below.

To follow along, check out [my git repository](https://github.com/rathboma/hadoop-framework-examples) (on the virtual machine):

{% highlight bash %}
cd ~/workspace
git clone https://github.com/rathboma/hadoop-framework-examples.git
cd hadoop-framework-examples
{% endhighlight %}

### Mapper

{% highlight python %}
import sys

for line in sys.stdin:
    line = line.strip()
    unpacked = line.split(",")
    stadium, capacity, expanded, location, surface, turf, team, opened, weather, roof, elevation = line.split(",")
    results = [turf, "1"]
    print("\t".join(results))

{% endhighlight %}


### Reducer

{% highlight python %}

import sys

# Example input (ordered by key)
# FALSE 1
# FALSE 1
# TRUE 1
# TRUE 1
# UNKNOWN 1
# UNKNOWN 1

# keys come grouped together
# so we need to keep track of state a little bit
# thus when the key changes (turf), we need to reset
# our counter, and write out the count we've accumulated

last_turf = None
turf_count = 0

for line in sys.stdin:

    line = line.strip()
    turf, count = line.split("\t")

    count = int(count)
    # if this is the first iteration
    if not last_turf:
        last_turf = turf

    # if they're the same, log it
    if turf == last_turf:
        turf_count += count
    else:
        # state change (previous line was k=x, this line is k=y)
        result = [last_turf, turf_count]
        print("\t".join(str(v) for v in result))
        last_turf = turf
        turf_count = 1

# this is to catch the final counts after all records have been received.
print("\t".join(str(v) for v in [last_turf, turf_count]))

{% endhighlight %}

You might notice that the reducer is significantly more complex then the pseudocode. That is because the streaming interface is limited and cannot really provide a way to implement the standard API.

As noted, each line read contains both the `KEY` and the `VALUE`, so it's up to our reducer to keep track of Key changes and act accordingly.

Don't forget to make your scripts executable:

{% highlight bash %}
chmod +x simple/mapper.py
chmod +x simple/reducer.py

{% endhighlight %}

### Testing

Because our example is so simple, we can actually test it without using hadoop at all.

{% highlight bash %}
cd streaming-python
cat ~/workspace/nfldata/unixstadiums.csv | simple/mapper.py | sort | simple/reducer.py
# FALSE 15
# TRUE 17
{% endhighlight %}

Looking good so far!

Running with Hadoop should produce the same output.

{% highlight bash %}
hadoop jar /usr/lib/hadoop-0.20-mapreduce/contrib/streaming/hadoop-streaming-2.0.0-mr1-cdh4.4.0.jar \
    -mapper mapper.py \
    -reducer reducer.py \
    -input nfldata/stadiums \
    -output nfldata/pythonoutput \
    -file simple/mapper.py \
    -file simple/reducer.py
# ...twiddle thumbs for a while

hadoop fs -text nfldata/pythonoutput/part-*
FALSE 15
TRUE 17
{% endhighlight %}


## A Complex Example in Python

Check out my [advanced python MapReduce guide][real-world-python] to see how to join two datasets together using python.

[real-world-python]:/hadoop/2016/02/09/python-tutorial.html
[beginners-guide]:/2013/04/17/what-is-hadoop.html
[bdm]:http://www.meetup.com/BigDataMadison/events/149122882/
[play-by-play]:http://www.advancednflstats.com/2010/04/play-by-play-data.html
[quickstart-vm]:http://www.cloudera.com/content/support/en/downloads/download-components/download-products.html?productID=F6mO278Rvo
[dashboard-screenshot]:/img/hadoop-dash-screenshot.png
