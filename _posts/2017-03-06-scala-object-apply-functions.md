---

title: 4 Fun and Useful Things to Know about Scala's apply() functions
published: false
layout: post
subject: hadoop
description: Scala's apply functions are commonly seen alongside case classes, but they can do so much more. Here are 4 fun ways they are used in Scala.
published: true
skipbooks: true
tags:
  - scala
  - programming
  - functional programming
  - tutorial
image:
  url: /img/companion-cube.jpg
  author:
    name: flughafen
    url: https://www.flickr.com/photos/p1hde/6589630165/


---

One confusing element of Scala for beginners is classes that can be constructed without the `new` keyword, like this `val p = Person()`. The reason for this is a special function called the `apply` function. In fact it is not actually a constructor, take note: you'll hear me say this quite a few times (it's important!).

## Apply Function Basics

A simple use of `apply` is to define it on an `Object`. This lets you call the `Object` as if the object itself was a function. Here's an example:

{% highlight scala %}

object Greet {
 def apply(name: String): String = {
   "Hello %s".format(name)
 }
}


// I can call apply explicitly if I want:
Greet.apply("bob")
// => "Hello bob"

// Or I can call Greet like it is a function:
Greet("bob")
// => "Hello bob"


{% endhighlight %}

This is really done with some compile time sugar which translates function calls to `Greet()` into calls to `Greet.apply()`. So really the apply function is a simple short-hand that lets you save a few characters.

Scala however loves the apply function, and so it is used in several interesting ways. Here are 4 interesting ways you can use (or do use) the `apply()` function in Scala.

## 1. Automatic Apply Functions for Case Class Companion Objects

This is the typical use case that makes many new Scala developers mistake `apply()` for a constructor.

Scala provides a special kind of class called the `case class`. I'll not go into details here, but consider the case class a simple version of a regular Java class that is designed to provide a simple set of fields and not much more.

Here's a really simple case class:

{% highlight scala %}

case class Person(name: String, age: Integer, favColor: String)

{% endhighlight %}

Case classes provide you with an automatically generated `apply` function on their companion object that you can use like a constructor. This is very confusing as it looks just like a constructor and quacks like a constructor, but it is not a constructor.

In fact, a built-in Scala macro has automatically generated an apply method to match our case class fields. The constructor still exists, and can be used normally too.

{% highlight scala %}

// The following three all do the same thing. Typically most developers use the first version

val p0 = new Person("Frank", 23, "Blue") // normal constructor

val p1 = Person("Frank", 23, "Blue") // this uses apply

val p2 = Person.apply("Frank", 23, "Blue") // using apply manually


{% endhighlight %}

## 2. Mistaking Apply() for a Constructor Can Cause Runtime Issues

Note that although case classes use `apply` like a constructor it is **not** a constructor. This is a really important distinction. It will cause issues if you're required to implement a specific constructor and will typically causes confusing stack traces **at runtime** if you're using a library that makes use of *reflection*.

Some libraries use reflection to 'sniff' your classes and make sure they can be constructed as expected, and may dynamically construct them. Any `apply` functions will not register as constructors, no matter how *you* use them in your code. Instead you'll get a runtime error and will need to figure out why.

So in our earlier example, this doesn't work: `val greeting = new Greet("bob")`.

Remember, `apply` is just a special function that lets us call the parent object directly, like a function. It has nothing to do with object orientation, classes, or constructors in the slightest.

## 3. Using Apply() as a clever class builder

Just because you commonly see apply functions alongside case classes in place of a constructor does not mean it has to return an instance of it's companion class. In our original example `Greet.apply()` returned a string, not an instance of a class called `Greet`.

So for example, this is totally kosher, although admittedly confusing:

{% highlight scala %}

case class Company(name: String)

class Person(val name: String) {}

object Person {

  def apply(name: String): Company = new Company(name)

}

// this is confusing, but works fine
val c = Person("Bob")
// => Company("Bob"): Company


{% endhighlight %}

I like to use this behavior to provide the correct inherited class from the base class's companion object.

Here's a simple example:

{% highlight scala %}

abstract class DatabaseDriver {
  // some database stuff
}

object DatabaseDriver {
  def apply(config: Configuration) = config.dbType match {
    case "MYSQL" => new MySqlDriver()
    case "PSQL" => new PostgresDriver()
    case _ => new GenericDriver()
  }
}

// now I get the right version!
val mydatabase = DatabaseDriver(dbConfig)

{% endhighlight %}

So instead of having a builder or factory, we use the companion object to create a streamlined pseudo-constructor.


Also note that like all functions in Scala and Java, you can override `apply` several times and have each function do something different. So in my example I could take a database connection string in a different apply function instead of a configuration object.


## 4. Apply Functions are used for Anonymous Functions

In scala you can create an anonymous function like so:

{% highlight scala %}

val func = (x: String) => "hello %s".format(x)

// call the function

func("world")
// => hello world

{% endhighlight %}

In reality you're actually just creating an object with an apply function. Scala does this for you automagically. You can even call `apply()` directly if you like:

{% highlight scala %}
  func.apply("world")
  // => hello world

{% endhighlight %}

In fact you're actually just creating an instance of a built in `Function` class, in this case `Function1[String, String]`. You can create it yourself if you like:

{% highlight scala %}
  val func2 = new Function1[String, String] {
    def apply(x: String) = "hello %s".format(x)
  }

// this works exactly the same:
func2("world")
// => hello world

func2.apply("world")
// => hello world

{% endhighlight %}


## 5. Bonus - Put an apply function in a class (not an object!)

You may have noticed that `Function1` is a class, not an object. You can add apply functions to your own classes too!

{% highlight scala %}

class Amazing {
  def apply(x: String) = "Amazing %s!".format(x)
}

// look how cool this is
val amazing = new Amazing()
amazing("world")
// => Amazing world!


{% endhighlight %}


So there you have it, a quick tour of Scala's apply function. We typically see it on objects, but you can put it on classes too! It is a very powerful concept, and along with the `unapply` function it allows you to do even more interesting things with pattern matching, but that is a topic for another time.

How do you use `apply()` in your code? Let me know in the comments below.
