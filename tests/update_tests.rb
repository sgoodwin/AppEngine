require 'net/http'
require 'uri'
require 'rubygems'
require 'yajl'
require 'rest_client'
require 'net/http/post/multipart'
require "base64"

def parse_json(string)
  parser = Yajl::Parser.new
  parser.parse(StringIO.new(string)){|obj| puts obj}
end

# Make sure all routes work:
puts "Executing basic checks, if anything fails you'll know you messed up:"

def check_delete_all_updates
  puts "\r\n\r\nDelete Updates:"
  headers = {:key=>'buttsbuttsbutts'}
  res = RestClient.delete("http://0.0.0.0:8080/tvlog/updates.json", headers);
  res.body
rescue => e
  parse_json(e.response)
end
#puts check_delete_all_updates

def check_new_update
  puts "\r\n\r\nJSON New update:"
  headers = {'key'=>'buttsbuttsbutts'}

  url = URI.parse('http://localhost:8080/tvlog/updates.json')
  File.open("./YoutubeTest.zip") do |zip|
    dict = {'buildNumber'=>'2', 'versionString'=>'1.0b1', 'dsaSignature'=>'abseddhdighvwihviwhvvhiwivh', "app" => UploadIO.new(zip, "application/octet-stream", "YoutubeTest.zip")}
    req = Net::HTTP::Post::Multipart.new(url.path, dict, headers)
    res = Net::HTTP.start(url.host, url.port) do |http|
      http.request(req)
    end
    return res
  end
end
#puts check_new_update

def check_new_dummy
  puts "\r\n\r\nJSON New dummy file:"
  headers = {'key'=>'buttsbuttsbutts'}

  url = URI.parse('http://localhost:8080/tvlog/updates.json')
  File.open("./feedback_tests.rb") do |zip|
    dict = {'buildNumber'=>'2', 'versionString'=>'1.0b1', 'dsaSignature'=>'abseddhdighvwihviwhvvhiwivh', "app" => UploadIO.new(zip, "application/octet-stream", "feedback_tests.rb")}
    req = Net::HTTP::Post::Multipart.new(url.path, dict, headers)
    res = Net::HTTP.start(url.host, url.port) do |http|
      http.request(req)
    end
    return res
  end
end
puts check_new_dummy

def check_update_list_json
  puts "\r\n\r\nUpdate list JSON:"
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:8080/tvlog/updates.json");
  return parse_json(res.body)
end
puts check_update_list_json

def check_update_list_sparkle
  puts "\r\n\r\nUpdate list Sparkle:"
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:8080/tvlog/updates.sparkle");
  return res.body
end
puts check_update_list_sparkle