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
puts "Executing basic checks, if anything fails you'll know you messed up:\r\n\r\n"

def check_new_feedback
  puts "\r\n\r\nJSON New feedback:"
  res = RestClient.post('http://0.0.0.0:8080/feedback.json',{'email'=>'noobface@aol.com', 'text'=>'Your app sucks!'}, {"key"=>"buttsbuttsbutts"})
  parse_json(res.body);
end
#puts check_new_feedback

def check_feedback_list_json
  puts "\r\n\r\nJSON Feedback List:";
  res = RestClient.get("http://0.0.0.0:8080/feedback.json", {"key"=>"buttsbuttsbutts"});
  return parse_json(res.body)
end
puts check_feedback_list_json