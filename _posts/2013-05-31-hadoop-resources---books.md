---
title: 15+ Great Books for Hadoop
layout: post
description: A compilation of books for Hadoop and related projects (hive, pig, hbase, etc).
subject: hadoop
tags:
- hadoop
- books
- hadoop resources
- big data
- offline infrastructure
- bug data books
- apache hive
- apache hbase
- apache pig
---
If you want to learn more about Hadoop there are many resources at your disposal, one such resource is books. I keep a list of Hadoop books privately, so I thought I'd put it on-line to save other people having to do the same research

## Books for Hadoop & Map Reduce

- [Hadoop: The Definitive Guide by Tom White][hadoop-guide]
  
  The Definitive guide is in some ways the 'hadoop bible', and can be an excellent reference when working on Hadoop, but do not expect it to provide a simple getting started tutorial for writing a Map Reduce. This book is great for really understanding how everything works and how all the systems fit together.

- [Hadoop Operations by Eric Sammer][hadoop-ops]

  This is the book if you need to know the ins and outs of prototyping, deploying, configuring, optimizing, and tweaking a production Hadoop system. [Eric Sammer][sammer] is a very knowledgeable engineer, so this book is chock full of goodies.

- [Map Reduce Design Patterns by Donald Miller and Adam Shook][design-patterns]

  Design Patterns is a great resource to get some insight into how to do non-trivial things with Hadoop. This book goes into useful detail on how to design specific types of algorithms, outlines why they should be designed that way, and provides examples.

- [Hadoop in Action by Chuck Lam][hadoop-action]

  One of the few non-O'Reilly books in this list, Hadoop in Action is similar to [the definitive guide][hadoop-guide] in that it provides a good reference for what Hadoop is and how to use it. It seems like this book provides a more gentle introduction to Hadoop compared to the other books in this list.

- [Hadoop in Practice by Alex Holmes][hadoop-practice]

  A slightly more advanced guide to running Hadoop. It includes chapters that detail how to best move data around, how to think in Map Reduce, and (importantly) how to debug and optimize your jobs.

- [Pro Hadoop by Jason Venner][pro-hadoop]
  
  This A-Press book claims it will guide you through initial hadoop set up while also helping you avoid many of the pitfalls that usual Hadoop novices encounter. Again it is similar in contents to [Hadoop in Action][hadoop-action] and [The Definitive Guide][hadoop-guide]

- [Hadoop Essentials: A Quantitative Approach by Henry Liu][hadoop-essentials]
  
  Another Hadoop intro book, Hadoop Essentials focuses on providing a more practical introduction to Hadoop which seems ideal for a CS classroom setting

- [Real World Hadoop Solutions Cookbook by Jonathan Owens, Brian Femiano & Jon Lentz][real-world-hadoop]
  
  A book which aims to provide real-world examples of common hadoop problems. It also covers building integrated solutions using surrounding tools (hive, pig, girafe, etc)

- [Hadoop Map Reduce Cookbook by Srinath Perera][hadoop-cookbook]
  
  The cookbook provides an introduction to installing / configuring Hadoop along with 'more than 50 ready-to-use Hadoop MapReduce recipes'.

- [Enterprise Data Workflows with Cascading][cascading-book]

  Released July 2013 this book promises to guide readers through writing and testing Cascading based workflows. This is one of the few books written about higher level Map Reduce frameworks, so I'm excited to give it a read.


## Books for Other Hadoop Projects
- [Programming Hive by Edward Capriolo, Dean Wampler & Jason Rutherglen][programming-hive]
  
  A detailed guide for understanding, running, debugging, and extending Hive
- [Programming Pig by Alan Gates][programming-pig]
  
  Programming Pig describes pig, walks you through how to use it, and helps you understand how to extend it
- [HBase the Definitive Guide by Lars George][hbase-guide]
  
  This book is to HBase what the [Hadoop Guide][hadoop-guide] is to Hadoop, a comprehensive walk-through of HBase, how it works, how to use it, and how it is designed.
- [Apache Sqoop Cookbook by Kathleen Tang & Jaroslav Cecho (released on June 22nd 2013)][sqoop-cookbook]
  
  A standalone Sqoop recipe book which covers common usage and integrations
- [Mahout in Action by Sean Owen, Robin Anil, Ted Dunning & Ellen Friedman][mahout]
  
  Apache Mahout is a set of machine learning libraries for Hadoop. This book provides a hands-on introduction and some sample use-cases.

## Bonus

- [Agile Data by Russell Jurney][agile]

  Russell introduces his own version of an agile tool-set for data analysis and exploration. The book covers both investigative tools (like Apache Pig), and visualization tools like D3. His pitch is pretty compelling

## That's It

There are many, many books on more general topics of big data, data science, analytics, etc, but I think I've covered the main books that specifically focus on Hadoop and related projects. Please email me or tweet me if I've missed anything!

[agile]:http://www.amazon.com/dp/1449326269?tag=matratsblo-20
[mahout]:http://www.amazon.com/dp/1935182684?tag=matratsblo-20
[hadoop-guide]:http://www.amazon.com/gp/product/1449311520/ref=as_li_ss_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1449311520&linkCode=as2&tag=matratsblo-20
[hadoop-ops]:http://www.amazon.com/gp/product/1449327052/ref=as_li_ss_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1449327052&linkCode=as2&tag=matratsblo-20
[sammer]:https://twitter.com/esammer
[design-patterns]:http://www.amazon.com/gp/product/1449327176/ref=as_li_ss_tl?ie=UTF8&camp=1789&creative=390957&creativeASIN=1449327176&linkCode=as2&tag=matratsblo-20
[programming-hive]:http://www.amazon.com/dp/1449319335?tag=matratsblo-20
[programming-pig]:http://www.amazon.com/dp/1449302645?tag=matratsblo-20
[hbase-guide]:http://www.amazon.com/dp/1449396100?tag=matratsblo-20
[hadoop-action]:http://www.amazon.com/dp/1935182196?tag=matratsblo-20
[hadoop-practice]:http://www.amazon.com/dp/1617290238?tag=matratsblo-20
[pro-hadoop]:http://www.amazon.com/dp/1430219424?tag=matratsblo-20
[hadoop-essentials]:http://www.amazon.com/dp/1480216372?tag=matratsblo-20
[real-world-hadoop]:http://www.amazon.com/dp/1849519129?tag=matratsblo-20
[hadoop-cookbook]:http://www.amazon.com/dp/1849517282?tag=matratsblo-20
[sqoop-cookbook]:http://www.amazon.com/dp/1449364624?tag=matratsblo-20
[cascading-book]:http://www.amazon.com/dp/1449358721?tag=matratsblo-20