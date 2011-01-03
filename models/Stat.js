var redis = require("redis"),
	client = redis.createClient(),
	async = require('async');

function Stat(hash){
	if(hash !== undefined){
		this.uid = hash.uid;
		this.appVersion = hash.appVersion;
		this.model = hash.model;
		this.lang = hash.lang;
		this.appName = hash.appName;
	}
}

Stat.find = function(statID, cb){
	var dict = {};
	dict.uid = statID.toString();
	var baseString = "stat:"+statID;
	var keys = [baseString+":appVersion", baseString+":model", baseString+":lang", baseString+":appName"];
	client.mget(keys, function(err, values){
		if(values[0] !== null) { dict.appVersion = values[0].toString();}
		if(values[1] !== null) { dict.model = values[1].toString();}
		if(values[2] !== null) { dict.lang = values[2].toString();}
		if(values[3] !== null) { dict.appName = values[3].toString();}
		var newStat = new Stat(dict);
		cb(err, newStat);
	});
};

Stat.all = function(appName, cb){
	client.smembers(appName + ':stat:ids', function(err, value){
		if(value.toString().length > 0){
			var ids = value.toString().split(',');
			async.map(ids, Stat.find, function(err, results){
				cb(results);
			});
		}else{
			cb([]);
		}
	});
};

Stat.prototype.update = function(hash){
	if(hash.appVersion !== undefined){this.appVersion = hash.appVersion;}
	if(hash.model !== undefined){this.model = hash.model;}
	if(hash.lang !== undefined){this.lang = hash.lang;}
	if(hash.appName !== undefined){this.appName = hash.appName;}
};

Stat.prototype.destroy = function(cb){
	var baseString = "stat:"+this.uid;
	client.del([baseString+":appVersion", baseString+":model", baseString+":lang", baseString+":appName"], function(err, retVal){
		cb(true);
	});
};

Stat.prototype.toJSON = function(){
	return {"uid":this.uid,"appVersion": this.appVersion,"model":this.model, "lang":this.lang, "appName":this.appName};
};

Stat.prototype.valid = function(){
	return true;
};

Stat.prototype.save = function(appName, cb){
	var stat = this;
	stat.appName = appName;
	if(this.valid()){
		if(stat.uid === undefined){
			client.incr('statID', function(err, newid){
				stat.uid = newid;
				stat.storeValues(cb);
			});
		}else{
			stat.storeValues(cb);
		}
	}else{
		cb(false);
	}
};

Stat.prototype.storeValues = function(cb){
	var stat = this;
	var baseString = "stat:"+stat.uid;
	var valuesAndKeys = [baseString+":appVersion", stat.appVersion, baseString+":model", stat.model, baseString+":lang", stat.lang];
	client.mset(valuesAndKeys, function(err, response){
		if(response === "OK"){
			client.sadd(stat.appName+':stat:ids', stat.uid, function(err, response){
				cb(true);
			});
		}else{
			cb(false);
		}
	});
};

module.exports = Stat;