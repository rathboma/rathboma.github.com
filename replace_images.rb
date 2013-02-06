require 'rubygems'

images = File.open('images.txt').read.split("\n")

files = Dir.glob("_posts/tumblr/*")

images.each_with_index do |image, i|
  localFile = "img/#{File.basename(image)}"
  localPath = "/" + localFile
  system("wget #{image} -o #{localFile}")
  files.each do |file|
    f = File.open(file)
    contents = f.read
    f.close
    new_contents = contents.gsub(image, localPath)
    f = File.open(file, 'w')
    f.puts(new_contents)
    f.close
  end
end
