---
title: Is it 'MapReduce' or 'Map Reduce'?
date: 2016-06-30
subject: hadoop
description: Confused about whether Map Reduce is one word or two? Let me settle this once and for all.
layout: post
published: true
image:
  url: /img/question.jpg
  author:
    name: Beatnik Photos
    url: https://www.flickr.com/photos/dharmabum1964/3108162671

---

MapReduce is a data processing methodology made popular by [Hadoop](http://hadoop.apache.org). It describes a way that multiple computational units can work together to process a large scale dataset whilst acting independantly and not depending on one another.

Should you call this technology 'MapReduce' or 'Map Reduce'? It's a question that is trivial, but common. Personally I'm very unreliable with how I describe the technology, [sometimes I write 'MapReduce'](http://blog.matthewrathbone.com/2016/01/05/experts-and-mapreduce.html), and [sometimes I write 'Map Reduce'](http://blog.matthewrathbone.com/2013/05/31/hadoop-resources-books.html).

The short version is that the correct spelling is 'MapReduce'. That is - all one word with R capitalized. You shouldn't write 'Map Reduce' or 'Map/Reduce'.

## The case for MapReduce vs Map Reduce

Google's seminal paper from 2004 is titled [*MapReduce: Simplified Data Processing on Large Clusters*](http://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf). They're very consistent about using *MapReduce* to describe the concept and nowhere in the paper do they split this into two words.

This is backed up by Google search traffic which shows *MapReduce* has a clear lead.

![Google Trends](/img/mapreduce.png)
screenshot from [Google Trends](https://www.google.com/trends/explore#q=MapReduce%2C%20Map%20Reduce&cmpt=q&tz=Etc%2FGMT%2B5)

The [Apache Hadoop website](http://hadoop.apache.org) and big Hadoop vendors like Cloudera and Hortonworks refer to it as *MapReduce* also.

## It's not all that clear

However, outside of the Hadoop ecosystem naming is less clear. MongoDB has it's own MapReduce implementation, but [it is referred to as 'Map-reduce'](https://docs.mongodb.com/manual/core/map-reduce/) (they don't even capitalize the R! \*Gasps\*).

Even back in Hadoop-land not all content has settled on the *MapReduce*. There are [several](http://ksat.me/map-reduce-a-really-simple-introduction-kloudo/) [examples](https://www.hackerrank.com/domains/distributed-systems/mapreduce-basics) of places where folks are confused, or even [use several different spellings](https://www.linkedin.com/pulse/map-reduce-tutorial-gives-brief-overview-application-agrawal).

## Wrap-up

It doesn't *really* matter of couse, but now you know -- one *MapReduce* to rule them all.

While you're here, check out [my guide to MapReduce frameworks](http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html)