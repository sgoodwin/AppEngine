var redis = require("redis"),
	client = redis.createClient(),
	sys = require('sys');
	async = require('async');

function Feedback(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.email = hash.email;
		this.text = hash.text;
		this.applicationName = hash.applicationName;
	}
}

Feedback.find = function(feedbackID, cb){
	var dict = {};
	dict.uid = feedbackID.toString();
	var baseString = "feedback:"+feedbackID;
	console.log(baseString);
	var keys = [baseString+":email", baseString+":text", baseString+":applicationName"];
	console.log("looking for keys: " + sys.inspect(keys));
	client.mget(keys, function(err, values){
	  console.log(values.toString());
		if(values[0] !== null && values[0] !== undefined) { dict.email = values[0].toString();}
		if(values[1] !== null && values[1] !== undefined) { dict.text = values[1].toString();}
		if(values[2] !== null && values[2] !== undefined) { dict.applicationName = values[2].toString();}
		console.log("got values: " + JSON.stringify(dict));
		var newFeedback = new Feedback(dict);
		cb(err, newFeedback);
	});
};

Feedback.all = function(cb){
	client.smembers('feedback:ids', function(err, value){
		if(value.toString().length > 0){
			var ids = value.toString().split(',');
			console.log("looking up ids: " + sys.inspect(ids));
			async.map(ids, Feedback.find, function(err, results){
				cb(results);
			});
		}else{
			cb([]);
		}
	});
};

Feedback.prototype.update = function(hash){
	if(hash.email !== undefined){this.email = hash.email;}
	if(hash.text !== undefined){this.text = hash.text;}
	if(hash.applicationName !== undefined){this.applicationName = hash.applicationName;}
};

Feedback.prototype.destroy = function(cb){
	var baseString = "feedback:"+this.uid;
	client.del([baseString+":email", baseString+":text", baseString+":applicationName"], function(err, retVal){
		cb(true);
	});
};

Feedback.prototype.toJSON = function(){
	return {"uid":this.uid,"applicationName":this.applicationName, "email": this.email,"text":this.text};
};

Feedback.prototype.valid = function(){
	return (this.text !== undefined && this.applicationName !== undefined); // emails are optional
};

Feedback.prototype.save = function(cb){
	var feedback = this;
	if(this.valid()){
		if(feedback.uid === undefined){
			client.incr('feedbackID', function(err, newid){
				feedback.uid = newid;
				feedback.storeValues(cb);
			});
		}else{
			feedback.storeValues(cb);
		}
	}else{
		cb(false);
	}
};

Feedback.prototype.storeValues = function(cb){
	var feedback = this;
	var baseString = "feedback:"+feedback.uid;
	var valuesAndKeys = [baseString+":email", feedback.email, baseString+":text", feedback.text, baseString+":applicationName", feedback.applicationName];
	client.mset(valuesAndKeys, function(err, response){
		if(response === "OK"){
			client.sadd('feedback:ids', feedback.uid, function(err, response){
				cb(true);
			});
		}else{
			cb(false);
		}
	});
};

module.exports = Feedback;