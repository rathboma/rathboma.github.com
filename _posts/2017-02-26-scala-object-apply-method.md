---
published: false
layout: post
---

One element of Scala that can often be confusing is how some classes needed to be created in the traditional style (eg `val p = new Person()`), and some could be created without the `new` keyword, eg `val p = Person()`.

The reason for this is a special function called the `apply` function.

## Apply Function Basics

The short description of an apply function is that you define it on an Object, and that lets you call the `Object` as if the object itself was a function.

Here's an example:

{% highlight scala %}

object Greet {
 def apply(name: String): String = {
   "Hello %s".format(name)
 }
}

// now I can call Greet like it is a function:
Greet("bob")
// => "Hello bob"

// I can call apply explicitly if I want:
Greet.apply("bob")
// => "Hello bob"

{%end highlight%}

This is really done with some compile time sugar which translates funtion calls to `Greet()` into calls to `Greet.apply()`. So really the apply function is a simple short-hand that lets you save a few characters.

However, while the apply function is fairly simple, it's used in several ways.

## Free With Case Classes

Scala provides a special kind of class called the `case class`. I'll not go into details here, but consider the case class a simple version of a regular Java class that is designed to be a POJO, IE hold a set of simple fields and not much more.

Here's a really simple case class:

{% highlight scala %}

case class Person(name: String, age: Integer, favColor: String)

{% end highlight %}

Using case classes provides you with an automatically generated `apply` function that you can use instead of a constructor. This is very confusing for new Scala developers as it looks just like a constructor, but no `new` keyword is used to build the case class.

In fact, a built-in Scala macro has automatically generated an apply method to match our case class constructor arguments. The constructor still exists, and can be used normally too.


{% highlight scala %}

// The following three all do the same thing. Typically most developers use the first version

val p = Person("Frank", 23, "Blue")

val p2 = new Person("Frank", 23, "Blue")

val p3 = Person.apply("Frank", 23, "Blue")


{% end highlight %}

## The Apply Function is Not a Constructor

Note that although case classes use `apply` like a constructor it is **not** a constructor. If you're passing classes to libraries that require a specific constructor the apply function won't work as a substitute. The `new` keyword just simply cannot be used with the apply function.

So in our earlier example, this doesn't work: `val greeting = new Greet("bob")`.

Remember, `apply` is just a special function that lets us call the parent object directly, like a function. It has nothing to do with object orientation, classes, or constructors in the slightest.

## The Apply Function Can Return Anything

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


{% end highlight %}

Also note that like all functions in Scala and Java, you can override `apply` several times and have each function do something different.








