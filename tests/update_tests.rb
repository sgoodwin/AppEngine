require 'net/http'
require 'uri'
require 'rubygems'
require 'yajl'

def parse_json(string)
  parser = Yajl::Parser.new
  parser.parse(StringIO.new(string)){|obj| puts obj}
end

# Make sure all routes work:
puts "Executing basic checks, if anything fails you'll know you messed up:\r\n\r\n"

def check_update_list_json
  puts "\r\n\r\nUpdate list JSON:"
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:8080/adium/updates.json");
  return parse_json(res.body)
end
puts check_update_list_json