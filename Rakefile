

template = <<-eos
---
title: TITLE
subject: SUBJECT
tags:
- tag1
---
Once upon a time...

eos


desc "create a new post"
task :new do
  print "title: "
  title = STDIN.gets.chomp
  print "subject: "
  subject = STDIN.gets.chomp
  dt = Time.now.strftime("%Y-%m-%d")

  filename = "_posts/#{dt}-#{title.gsub(/\s+/, "-")}.md"
  File.open(filename, 'w') { |file|
    file.puts template.gsub("TITLE", title).gsub("SUBJECT", subject)
  }

end