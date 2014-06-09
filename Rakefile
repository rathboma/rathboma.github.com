require 'fileutils'

template = <<-eos
---
title: TITLE
layout: post
description: blog post by Matthew Rathbone
subject: SUBJECT
tags:
- tag1
---
Once upon a time...

eos

def ask(question)
  print(question + ": ")
  STDIN.gets.chomp
end


desc "create a new post, and puts it in the drafts folder"

task :new do
  title = ask("title")
  subject = ask("subject")
  dt = Time.now.strftime("%Y-%m-%d")
  system("mkdir -p drafts")
  filename = "drafts/#{dt}-#{title.downcase.gsub(/\s+/, "-")}.md"
  File.open(filename, 'w') { |file|
    file.puts template.gsub("TITLE", title).gsub("SUBJECT", subject)
  }
end


task :publish do
  docs = Dir.entries('drafts/') - ['.', '..']
  puts "which would you like to move to _posts?"
  docs.each_with_index do |item, idx|
    puts "#{idx} - #{item}"
  end
  puts "x - cancel"
  selection = ask("enter your selection")
  exit(0) if selection == 'x'
  selection = selection.to_i
  FileUtils.mv("drafts/#{docs[selection]}", "_posts/")
  puts("-> _posts/#{docs[selection]}")
end