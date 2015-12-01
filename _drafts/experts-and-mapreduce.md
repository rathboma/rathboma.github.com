---
published: false
title: 5 Industry Veterens Talk About Their Favorite MapReduce Frameworks
---


Over the last 2 years I've published [numberous MapReduce framework guides][1], but I've given no real direction on *which* framework to use and why.

If you're just getting started with Hadoop and MapReduce I know figuring out where to start can be very overwhelming, so getting direction is important!

I figured instead of flapping my own opinions (which are outdated honestly), I'd reach out to folks who are writing production code every day and ask them what they use. So here we go.

## Questions

1. Which MapReduce Framework do you prefer to work in?
2. Why do you like using it vs regular MapReduce?
3. Why do you like using it vs other MapReduce frameworks?

Note that opinions expressed by those interviewed are personal and do not nessecerily represent employer opinions.

## Joe Stein, CEO of Elodina

As well as running Elodina, Joe runs [All Things Hadoop](http://allthingshadoop.com/), and talks about distributed computing at a range of conferences and events.

### Which MapReduce Framework do you prefer to work in?

Scalding

### Why do you like using it vs regular MapReduce

It is easy to reason about composing data together when the language is composing functions around the data.

### Why do you like using it vs other frameworks?

After Scalding I would skip over them all and go straight to Python streaming as my next default.

## Sam Wang, Software Engineer at Foursquare

When I worked at Foursquare I would constantly drag Sam into Hadoop infrastructure projects becuase he was so good at them, even though he was meant to be working on machine learning.

### Which MapReduce Framework do you prefer to work in?

Scalding

### Why do you like using it vs regular MapReduce

Implementing intuitive joins with Scala types in Scalding is very easy, and is probably the number one feature that our engineers love over writing in any other framework.

In our ecosystem, writing joins in native MR always required writing throw-away container types for joins in Thrift, which added an unnecessary layer of complexity to a task. Also, implementing any of the join primitives in Scalding in MR (outerJoin, hashJoin, etc.) is very cumbersome in vanilla MR, and usually resulted in code that was not reusable from task to task.

Being able to depend on the native Scalding serialization for Scala types is also convenient, as users don't have to think too hard about how data flows over a wire, and how to serialize and deserialize their complex types. Finally, there's just less boilerplate code in general, and the code is much more readable to anyone skimming a flow to figure out exactly what the salient bits of it are.

### Why do you like using it vs other frameworks?

Foursquare arrived at Scalding via an organic process, which was partially technical, and partially cultural. We had previously invested in a framework called Scoobi, but we wanted to switch to a framework with a richer ecosystem of developers and support.

The Scalding API looks similar to writing Scoobi, so the switch was not as dramatic as if we had switched to something that looked completely different. We had already invested a lot in tuning our cluster to run MR version 1 jobs, and the appeal of Scalding working out of the box on our existing infrastructure was the other major deciding factor in why we chose it.

Scalding, at the time, seemed like the best way to mix our existing codebase with more Scala-idiomatic join primitives and classes.


## David Leifker, Software Architect at Spreadfast

### Which MapReduce Framework do you prefer to work in?

Spark

### Why do you like using it vs regular MapReduce?

Simply put Spark is better able to execute iterative operations faster then M/R. This is readily apparent for ML applications. Currently there is MLlib for Spark, but Mahout is also shifting to use Spark for this reason. The ability to cache, or pin, RDDs in memory also helps to speed up certain operations.


### Why do you like using it vs other frameworks?

Honestly, it was a natural fit for the type of problems I was looking to solve, those being oriented around ML. If you are looking to perform non-iterative batch processing that cannot fit in the distributed memory of your cluster, M/R is still the likely winner.

Spark compared to say Storm is a question of is it easier to move your data or read it in place. It depends on where the data is. If the bulk of the data is already collected and stored in the cluster, its easier to reason about moving processing to the where the data is stored, potentially changing how its distributed. Compare that to moving already written data through a topology of processors incurs added complexity and performance implications. However if you're ingesting a stream of incoming data anyway, Storm may have some benefits.

Essentially the framework of choice is to pick the right tool for the job, any one solution is always going to have its strengths.


## Eli Collins, Chief Technologist at Cloudera



## Andrew Walkingshaw, Senior Software Engineer at Jaunt VR

## You

Which framework do you use? Let everyone know with the poll below!

<div id="qp_all501268" style="width:100%;"><link href='//fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'><STYLE>#qp_main501268 .qp_btna:hover input {background: rgb(0, 53, 95) none repeat scroll 0% 0%!important}</STYLE><div id="qp_main501268" fp='26fa409c-21' results=0 style="border-radius: 0px;margin: 0px auto;padding: 0.36em;background: rgb(255, 255, 255) none repeat scroll 0% 0%;font-family: 'Open Sans',sans-serif,Arial;color: rgb(0, 0, 0);border: 1px solid rgb(219, 217, 217);max-width: 792px"><div style="font-size: 1.2em;background: rgb(0, 53, 95) none repeat scroll 0% 0%;color: rgb(255, 255, 255);font-family: 'Open Sans',sans-serif,Arial;border-color: rgb(255, 255, 255)"><div style="padding: 0.8em;line-height: 1.3em">Which MapReduce Framework Do You Prefer?</div></div><form id="qp_form501268" action="//www.poll-maker.com/results501268x26fa409c-21" method="post" target="_blank" style="display: inline;margin: 0px;padding: 0px"><div style="padding: 0px"><input type=hidden name="qp_d501268" value="42340.3185300914-42340.3184984673"><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="1" />Spark</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="2" />Scalding</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="3" />Cascading</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="4" />Scoobi</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="5" />Hadoop Streaming (Python / Ruby / etc)</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="6" />R Hadoop</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="7" />Scrunch</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="8" />Pig</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="9" />Hive</span></div><div style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)" class="qp_a" onClick="var c=this.getElementsByTagName('INPUT')[0]; if((!event.target?event.srcElement:event.target).tagName!='INPUT'){c.checked=(c.type=='radio'?true:!c.checked)};var i=this.parentNode.parentNode.parentNode.getElementsByTagName('INPUT');for(var k=0;k!=i.length;k++){i[k].parentNode.parentNode.setAttribute('sel',i[k].checked?1:0)}"><span style="display: block;padding-left: 30px;cursor: inherit"><input style="float: left;width: 20px;margin-left: -25px;margin-top: 2px;padding: 0px;height: 20px" name="qp_v501268" type="radio" value="999" />Other</span></div><div id="qp_ot501268" style="color: rgb(107, 107, 107);font-family: 'Open Sans',sans-serif,Arial;font-size: 1.1em;line-height: 1.5;padding: 0.07em 0.57em;margin: 10px 0px;clear: both;border-color: rgb(107, 107, 107)"><div style="padding-left:33px">Please Specify: <input style="width:100%;position:relative;top:2px" name='qp_other501268' type=text value=''></div></div></div><div style="padding-left: 0px;min-height: 40px;clear: both"><a style="float: left;width: 50%;max-width: 140px;box-sizing: border-box;padding-right: 5px;text-decoration: none" class="qp_btna" href="#"><input name="qp_b501268" style="width: 100%;height: 40px;background-color: rgb(11, 121, 211);font-family: 'Open Sans',sans-serif,Arial;font-size: 16px;color: rgb(255, 255, 255);cursor: pointer;border: 0px none;border-radius: 0px" type="submit" btype="v" value="Vote" /></a><a style="float: left;width: 50%;max-width: 140px;box-sizing: border-box;padding-left: 5px;text-decoration: none" class="qp_btna" href="#"><input name="qp_b501268" style="width: 100%;height: 40px;background-color: rgb(11, 121, 211);font-family: 'Open Sans',sans-serif,Arial;font-size: 16px;color: rgb(255, 255, 255);cursor: pointer;border: 0px none;border-radius: 0px" type="submit" btype="r" value="Results" /></a></div><a id="qp_a501268" style="float:right;font-family:Arial;font-size:10px;color:rgb(0,0,0);text-decoration:none" href="http://www.poll-maker.com">Poll Maker</a></form><div style="display:none"><div id="qp_rp501268" style="font-size: 14px;width: 5ex;text-align: right;overflow: hidden;position: absolute;right: 5px;height: 1.5em;line-height: 1.5em"></div><div id="qp_rv501268" style="font-size: 14px;line-height: 1.5em;width: 0%;text-align: right;color: rgb(255, 255, 255);box-sizing: border-box;padding-right: 3px"></div><div id="qp_rb501268" style="font-size: 14px;line-height: 1.5em;color: rgb(255, 255, 255);display: block"></div><div id="qp_rva501268" style="background: rgb(0, 111, 185) none repeat scroll 0% 0%;border-color: rgb(0, 111, 185)"></div><div id="qp_rvb501268" style="background: rgb(22, 52, 99) none repeat scroll 0% 0%;border-color: rgb(22, 52, 99)"></div><div id="qp_rvc501268" style="background: rgb(91, 207, 252) none repeat scroll 0% 0%;border-color: rgb(20, 129, 171)"></div></div></div></div><script src="//scripts.poll-maker.com/3012/scpolls.js" language="javascript"></script>






[1]:http://blog.matthewrathbone.com/2013/01/05/a-quick-guide-to-hadoop-map-reduce-frameworks.html
