var redis = require("redis"),
	client = redis.createClient();

function User(hash){
	if(hash !== undefined){
		this.key = hash.key;
	}
}

User.exists = function(key, callback){
	client.get('userKey', function(err, value){
		callback(value === key);
	});
};

module.exports = User;