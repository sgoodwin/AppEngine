var redis = require("redis"),
	client = redis.createClient(),
	async = require('async');

function Feedback(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.email = hash.email;
		this.text = hash.text;
	}
}

Feedback.find = function(feedbackID, cb){
	var dict = {};
	dict.uid = feedbackID.toString();
	var baseString = "feedback:"+feedbackID;
	var keys = [baseString+":email", baseString+":text"];
	client.mget(keys, function(err, values){
		if(values[0] !== null) { dict.email = values[0].toString();}
		if(values[1] !== null) { dict.text = values[1].toString();}
		var newFeedback = new Feedback(dict);
		cb(err, newFeedback);
	});
};

Feedback.all = function(cb){
	client.smembers('feedback:ids', function(err, value){
		var ids = value.toString().split(',');
		async.map(ids, Feedback.find, function(err, results){
			cb(results);
		});
	});
};

Feedback.prototype.update = function(hash){
	if(hash.email !== undefined){this.email = hash.email;}
	if(hash.text !== undefined){this.text = hash.text;}
};

Feedback.prototype.destroy = function(cb){
	var baseString = "feedback:"+this.uid;
	client.del([baseString+":title", baseString+":htmlURL", baseString+":rssURL"], function(err, retVal){
		cb(true);
	});
};

Feedback.prototype.toJSON = function(){
	return {"uid":this.uid,"email": this.email,"text":this.text};
};

Feedback.prototype.valid = function(){
	return (this.text !== undefined); // emails are optional
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
	var valuesAndKeys = [baseString+":email", feedback.email, baseString+":text", feedback.text];
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