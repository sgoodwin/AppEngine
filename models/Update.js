var redis = require("redis"),
	client = redis.createClient(),
	async = require('async');

/*
Example Update:
<item>
    <title>Version 2.0 (2 bugs fixed; 3 new features)</title>
    <sparkle:releaseNotesLink>
        http://you.com/app/2.0.html
    </sparkle:releaseNotesLink>
    <pubDate>Wed, 09 Jan 2006 19:20:11 +0000</pubDate>
    <enclosure url="http://you.com/app/Your Great App 2.0.zip"
               sparkle:version="2.0"
			   sparkle:shortVersionString="2.0b2"
               sparkle:dsaSignature="MC0CFBfeCa1JyW30nbkBwainOzrN6EQuAh="
               length="1623481"
               type="application/octet-stream" />
</item>

*/

function Update(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.applicationName = hash.applicationName;
		this.pubDate = hash.pubDate;
		if(this.pubDate === undefined){
			var d = new Date();
			this.pubDate = d.toString();
		}
		this.fileURL = hash.fileURL;
		this.buildNumber = hash.buildNumber;
		this.versionString = hash.versionString;
		this.dsaSignature = hash.dsaSignature;
		this.length = hash.length;
	}
}

Update.find = function(updateID, cb){
	var dict = {};
	dict.uid = updateID.toString();
	var base = "update:"+updateID;
	var keys = [base+":pubDate", base+":fileURL", base+":buildNumber", base+":versionString", base+":dsaSignature", base+":length"];
	client.mget(keys, function(err, values){
		if(values[0] !== null) { dict.pubDate = values[0].toString();}
		if(values[1] !== null) { dict.fileURL = values[1].toString();}
		if(values[2] !== null) { dict.buildNumber = values[2].toString();}
		if(values[3] !== null) { dict.versionString = values[3].toString();}
		if(values[4] !== null) { dict.dsaSignature = values[4].toString();}
		if(values[5] !== null) { dict.length = values[5].toString();}
		var newUpdate = new Update(dict);
		cb(err, newUpdate);
	});
};

Update.all = function(applicationName, cb){
	client.smembers(applicationName+':ids', function(err, value){
		if(value.toString().length > 0){
			var ids = value.toString().split(',');
			async.map(ids, Update.find, function(err, results){
				cb(results);
			});
		}else{
			cb([]);
		}
	});
};

Update.prototype.update = function(hash){
	if(hash.applicationName !== undefined){this.applicationName = hash.applicationName;}
	if(hash.pubDate !== undefined){this.pubDate = hash.pubDate;}
	if(hash.fileURL !== undefined){this.fileURL = hash.fileURL;}
	if(hash.buildNumber !== undefined){this.buildNumber = hash.buildNumber;}
	if(hash.versionString !== undefined){this.versionString = hash.versionString;}
	if(hash.dsaSignature !== undefined){this.dsaSignature = hash.dsaSignature;}
	if(hash.length !== undefined){this.length = hash.length;}
};

Update.prototype.destroy = function(applicationName, cb){
	var update = this;
	var base = "update:"+update.uid;
	var keys = [base+":pubDate", base+":fileURL", base+":buildNumber", base+":versionString", base+":dsaSignature", base+":length"];
	client.del(keys, function(err, retVal){
		client.srem(applicationName+":ids", update.uid, function(err, result){
			cb(true);
		});
	});
};

Update.prototype.toJSON = function(){
	return {"applicationName":this.applicationName, "uid":this.uid,"pubDate": this.pubDate,"fileURL":this.fileURL, "buildNumber":this.buildNumber, "versionString":this.versionString, "dsaSignature":this.dsaSignature, "length":this.length};
};

Update.prototype.valid = function(){
	if(this.applicationName === undefined){return false;}
	if(this.pubDate === undefined){return false;}
	if(this.fileURL === undefined){return false;}
	if(this.buildNumber === undefined){return false;}
	if(this.versionString === undefined){return false;}
	if(this.dsaSignature === undefined){return false;}
	if(this.length === undefined){return false;}
	return true;
};

Update.prototype.save = function(applicationName, cb){
	var update = this;
	update.applicationName = applicationName;
	if(this.valid()){
		if(update.uid === undefined){
			client.incr('updateID', function(err, newid){
				update.uid = newid;
				update.storeValues(cb);
			});
		}else{
			update.storeValues(cb);
		}
	}else{
		console.log("update not valid");
		cb(false);
	}
};

Update.prototype.storeValues = function(cb){
	var update = this;
	var base = "update:"+update.uid;
	var valuesAndKeys = [base+":pubDate", update.pubDate, base+":fileURL", update.fileURL, base+":buildNumber", update.buildNumber, base+":versionString", update.versionString, base+":dsaSignature", update.dsaSignature, base+":length", update.length];
	client.mset(valuesAndKeys, function(err, response){
		if(response === "OK"){
			client.sadd(update.applicationName+':ids', update.uid, function(err, response){
				cb(true);
			});
		}else{
			cb(false);
		}
	});
};

module.exports = Update;