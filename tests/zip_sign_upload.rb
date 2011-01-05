#!/usr/bin/env ruby
require 'rubygems'
require 'osx/plist'
require 'rest_client'
require 'aws/s3'

if(ARGV.length < 3)
  puts "Usage: ruby zip_sign_upload.rb path_to_private_key app_engine_key path_to_app_bundle [ info_plist_filename]"
  exit
end

key_path = ARGV[0]
key_string = ARGV[1]
filePath =  ARGV[2]
plistFileName = ARGV[3] || "Info.plist"
bucketName = "goodwinlabs"

plistFilePath = "#{filePath}/Contents/#{plistFileName}"
puts "Checking for plist info at #{plistFilePath}"
begin
  plist, format = OSX::PropertyList.load_file(plistFilePath, true)
rescue OSX::PropertyListError => e
  puts "You need to supply the path to a legit property!"
  exit
end

versionString = plist["CFBundleShortVersionString"]
bundleVersion = plist["CFBundleVersion"]
name = plist["CFBundleName"]
if(versionString == nil || bundleVersion == nil || name == nil)
  puts "You need to supply the path to a legit property!"
  exit
end

puts "Submitting application with the following data:"
puts "Bundle Name: #{name}"
puts "Identifier: #{plist["CFBundleIdentifier"]}"
puts "Bundle Version: #{bundleVersion}"
puts "Version String: #{versionString}"
puts "\n"
puts "Is this cool?"
answer = STDIN.gets.chomp
if(answer != "y")
  puts "Ok, fix your shit."
  exit
end
puts "\n"

baseName = filePath.split('/').last
basePath = filePath.gsub(baseName, '')
zipFileName = baseName.gsub('.app', "#{versionString}.zip")
zipFilePath = "#{basePath}#{zipFileName}"
puts "Using zip file Path: #{zipFilePath}"
if(File.exists?(zipFilePath))
  puts "File exists, deleting"
  File.delete(zipFilePath)
end
puts "Generating Zip File Called: #{zipFileName}"
output = IO.popen("cd #{basePath};zip -r ./#{zipFileName} #{baseName}")
puts output.readlines

puts "Signing zip file..."

output2 = IO.popen("openssl dgst -sha1 -binary < '#{zipFilePath}' | openssl dgst -dss1 -sign '#{key_path}' | openssl enc -base64")
dsaSignature = output2.readlines[0]

puts "Submitting #{zipFileName} with dsaSignature: #{dsaSignature}"
AWS::S3::Base.establish_connection!(
    :access_key_id     => ENV['AMAZON_ACCESS_KEY_ID'], 
    :secret_access_key => ENV['AMAZON_SECRET_ACCESS_KEY']
)
puts "Looking for file to upload here: #{zipFilePath}"
AWS::S3::S3Object.store(zipFileName, open("#{zipFilePath}"), bucketName)

amazon_url = "https://s3.amazonaws.com/#{bucketName}/#{zipFileName}"
headers = {:key=>key_string}
dict = {'buildNumber'=>bundleVersion, 'versionString'=>versionString, 'dsaSignature'=>dsaSignature, "fileURL" => amazon_url, "length"=>File.size(zipFilePath)}
res = RestClient.post("http://appengine.goodwinlabs.com/#{name}/updates.json", dict, headers);
res.body

puts "\n\nEnjoy!"