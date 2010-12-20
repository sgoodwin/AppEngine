require 'net/http'
require 'uri'
require 'rubygems'
require 'yajl'
require 'rest_client'

def parse_json(string)
  parser = Yajl::Parser.new
  parser.parse(StringIO.new(string)){|obj| puts obj}
end

# Make sure all routes work:
puts "Executing basic checks, if anything fails you'll know you messed up:"

def check_delete_all_updates
  puts "\r\n\r\nDelete Updates:"
  res = RestClient.delete("http://0.0.0.0:8080/adium/updates.json?key=buttsbuttsbutts");
  res.body
rescue => e
  parse_json(e.response)
end
puts check_delete_all_updates

def check_new_update
  puts "\r\n\r\nJSON New update:"
  dict = {'buildNumber'=>'1',
          'versionString'=>'1.0b1',
          'dsaSignature'=>'abseddhdighvwihviwhvvhiwivh',
          'key'=>'buttsbuttsbutts'}
  res = RestClient.post 'http://localhost:8080/adium/updates.json', dict.merge(:app => File.new('./YoutubeTest.zip'))
  res.body
rescue => e
  parse_json(e.response)
end
puts check_new_update

def check_update_list_json
  puts "\r\n\r\nUpdate list JSON:"
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:8080/adium/updates.json?key=buttsbuttsbutts");
  return parse_json(res.body)
end
puts check_update_list_json