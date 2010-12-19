/*
 Pull in deps.
*/
var express = require('express'),
	connect = require('connect'),
	redis = require("redis"),
	client = redis.createClient(),
	Feedback = require('./models/Feedback.js');
/*
 Configuration
*/
var app = express.createServer();
app.configure(function(){
	app.use(connect.bodyDecoder());
	app.use(connect.methodOverride());
	app.use(app.router);
});

app.configure('development', function(){
	app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(connect.errorHandler()); 
});

/*
 Basic request to make sure server is running.
 */

app.get('/', function(req, res){
	res.send('Welcome to the party! We\'ve been waiting.');
});

/*
	Feedback handling
*/
app.post('/feedback.:format?', function(req, res){
	var feedback = new Feedback(req.body);
	if(feedback.valid()){
		feedback.save(function(success){
			// Possibly generate email or some such here.
			res.send(success.toString());
		});
	}else{
		res.send('DNE');
	}
});

app.get('/feedback.:format?', function(req, res){
	Feedback.all(function(feedbacks){
		res.send(JSON.stringify(feedbacks));
	});
});

/*
 Start server now.
*/
if (!module.parent) {app.listen(8080);}