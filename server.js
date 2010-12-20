/*
 Pull in deps.
*/
var formidable = require('formidable'),
	express = require('express'),
	connect = require('connect'),
	redis = require("redis"),
	client = redis.createClient(),
	Feedback = require('./models/Feedback.js'),
	Update = require('./models/Update.js'),
	User = require('./models/User.js'),
	sys = require('sys'),
	fs = require('fs'),
	async = require('async');
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

// User rejection
function InvalidUser(msg){
    this.name = 'InvalidUser';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(InvalidUser, Error);
app.error(function(err, req, res, next){
    if (err instanceof InvalidUser) {
        res.send('Invalid User');
    } else {
        next(err);
    }
});

/*
 Basic request to make sure server is running.
 */

app.get('/', function(req, res){
	res.send('Welcome to the party! We\'ve been waiting.');
});

/*
 Auth support
*/

function checkUser(req, res, next){
	User.exists(req.param('key'), function(yesno){
		if(yesno){
			next();
		}else{
			res.send(JSON.stringify({'error':'Invalid User'}), 401);
		}	
	});
}

/*
	Feedback handling
*/
app.post('/feedback.:format?', checkUser, function(req, res){
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

app.get('/feedback.:format?', checkUser, function(req, res){
	Feedback.all(function(feedbacks){
		res.send(JSON.stringify(feedbacks));
	});
});

/*
	Update handling
*/

app.del('/:applicationName/updates.:forma?', checkUser, function(req, res){
	// Delete all updates listed.
	var name = req.param('applicationName').toLowerCase();
	Update.all(name, function(updates){
		async.forEach(updates, function(update, callback){
			update.destroy(name, callback);
		}, function(err){
			res.send(200);
		});
	});
});

app.get('/:applicationName/updates.:format?', checkUser, function(req, res){
	var name = req.param('applicationName').toLowerCase();
	Update.all(name, function(updates){
		res.send(JSON.stringify(updates));
	});
});

app.post('/:applicationName/updates.:format?', checkUser, function(req, res){
	var form = new formidable.IncomingForm();
	form.uploadDir = './files/';
	form.parse(req, function(err, fields, files) {
		var update = new Update(fields);
		var name = req.param('applicationName').toLowerCase();
		update.applicationName = name;
		
		var fileInfo = files.app;
		if(fileInfo.mime !== 'application/zip') {res.send('Attachment isn\'t a zip file!', 418); }
		
		update.length = fileInfo.length;
		update.fileURL = './files/' + name + update.versionString + '.zip';		
		fs.rename(fileInfo.path, update.fileURL, function(err){
			if(err) {throw err;}
			update.save(name, function(success){
				if(success){
					res.send('OK');
				}else{
					res.send(418);
				}
			});
		});
	});
});

/*
 Start server now.
*/
if (!module.parent) {app.listen(8080);}