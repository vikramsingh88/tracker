var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var db = require('../models/db.js');

var User = mongoose.model('User');

var secret = "ThisIsMyIndia";

//create new user
module.exports.createNewUser = function(req, res) {
  console.log('In create new user function');
  //Get values from body sent within bodyParser
  var userName = req.body.userName;
  var password = req.body.password;
  var location = req.body.location;
  var contact = req.body.contact;
  var deviceId = req.body.deviceId;
  console.log(userName);
  //Creating new user and assigning values
  var newUser = new User();
  newUser.userName = userName;
  newUser.password = password;
  newUser.location = location;
  newUser.contact = contact;
  newUser.deviceId = deviceId;
  newUser.timeStamp = new Date();
  //saving user data to mongodb
  newUser.save(function(err, savedUser) {
    if(err) {
      var message=err;
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
		} else {
			var message="a new user created with name "+savedUser.userName;
      res.status(201).send({'statusMessage' : 'success', 'message' : message, 'data':savedUser});
		}
  });
}

//Check if user all ready exist
module.exports.userExist = function(req, res) {
  console.log('In user exist method');
  //Get the values from request body
  var userName = req.body.userName;
  // find user if exist
  User.findOne({ 'userName': userName}, function (err, user) {
    if (err) {
      var message=err;
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    }
    console.log(user);
    if(user == null) {
      var message = userName+" does not exist";
      res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':user});
    } else {
      var message = user.userName+" already exist";
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':user.userName});
    }
  });
}

//Check if Contact exist
module.exports.contactExist = function(req, res) {
  //console.log('In contact exist method');
  //Get the values from request body
  var contact = req.body.contact;
  // find user if exist
  User.findOne({'contact': contact}, function (err, user) {
    if (err) {
      var message=err;
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    }
    //console.log(user);
    if(user == null) {
      var message = contact+" does not exist";
      res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':user});
    } else {
      var message = user.contact+" exist";
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':user.contact});
    }
  });
}

//Authenticate user
module.exports.authenticate = function(req, res) {
  var userName = req.body.userName;
  var password = req.body.password;
  // find the user
  User.findOne({'userName': userName}, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.json({'statusMessage': 'error', 'message': 'Authentication failed. User not found.','data' :null });
    } else if (user) {
      // check if password matches
      if (user.password != password) {
        res.json({ 'statusMessage': 'error', message: 'Authentication failed. Wrong password.', 'data' :null });
      } else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, secret, {});
        // return the information including token as JSON
        res.json({
          'statusMessage': 'success',
          'message': 'Enjoy your token!',
          'data': token
        });
      }
    }
  });
}

//Get all registered user
module.exports.getAllUsers = function(req, res) {
  console.log('toekn', req.decoded);
  console.log('user name', req.decoded._doc.userName);
  User.find(function(err, users) {
    if (err) {
      return res.status(500).send({'statusMessage' : 'error', 'message' : 'internal server error', 'data':null});
    } else if (!users) {
      return res.status(200).send({'statusMessage' : 'error', 'message' : 'no user available', 'data':null});
    } else {
      return res.status(200).send({'statusMessage' : 'success', 'message' : 'user available', 'data':users});
    }
  });
}
