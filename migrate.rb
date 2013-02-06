require 'rubygems'
require "jekyll/migrators/tumblr"

Jekyll::Tumblr.process("http://blog.matthewrathbone.com", "html", true, false, true)
