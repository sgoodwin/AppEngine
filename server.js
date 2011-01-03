/*
Pull in deps.
*/
var express = require('express'),
    connect = require('connect'),
    formidable = require('formidable'),
    redis = require("redis"),
    client = redis.createClient(),
    Feedback = require('./models/Feedback.js'),
    Update = require('./models/Update.js'),
    User = require('./models/User.js'),
    Stat = require('./models/Stat.js'),
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
  var userKey = req.header('key');
  User.exists(userKey, function(yesno){
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
app.post('/:applicationName/feedback.:format?', checkUser, function(req, res){
  var name = req.param('applicationName');
  var feedback = new Feedback(req.body);
  feedback.applicationName = name;
  console.log("Saving feedback: " + JSON.stringify(feedback));
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
  var name = req.param('applicationName');
  Update.all(name, function(updates){
    async.forEach(updates, function(update, callback){
      update.destroy(name, callback);
    }, function(err){
      res.send(200);
    });
  });
});

app.get('/:applicationName/updates.:format?', function(req, res){
  var name = req.param('applicationName');
  var stat = new Stat(req.query);
  stat.save(name, function(truefalse){
    console.log("Saving stats: " + truefalse);
  });
  Update.all(name, function(updates){
    if(req.param('format') == 'json'){
      res.send(JSON.stringify(updates));
    }
    if(req.param('format') == 'sparkle'){
      res.render('updates.ejs', {
        layout: false,
        locals: {
          name: req.param('applicationName'),
          updates: updates,
          url: "http://"+req.header('host')+req.url
        }
      });
    }
  });
});

app.post('/:applicationName/updates.:format?', checkUser, function(req, res){  
  var update = new Update(req.body);
  var name = req.param('applicationName');
  update.applicationName = name;
  update.save(name, function(truefalse){
    res.send(JSON.stringify({'sucesss': truefalse}));
  });
});

/*
Start server now.
*/
if (!module.parent) {app.listen(8080);}
console.log("Listening on port 8080..... now!");