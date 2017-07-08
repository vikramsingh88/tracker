var mongoose = require('mongoose');
var db = require('../models/db.js');
var gcm = require('node-gcm');

var User = mongoose.model('User');
var Location = mongoose.model('Location');
var LocationVisibility = mongoose.model('LocationVisibility');

var serverKey = "AAAAnFE10cY:APA91bEVBr5zQWjTavvQ-P006ZJoEriGuaW2ebHR5StVQRwJnGtLTDqeiTRfRDzUnLWBzl3S4b48PlhbR5VqpOLv-bTkmyFFzh-wBASCYb6kDRg0KFKcGQ3eIKNFtBxzt-fibEWDhPT5";
// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
var sender = new gcm.Sender(serverKey);

module.exports.saveLocation = function(req, res) {
  var userName = req.decoded._doc.userName;
  var contact = req.decoded._doc.contact;
  var latlon = req.body.latlon;
  var address = req.body.address;

  var location = new Location();
  location.userName = userName;
  location.contact = contact;
  location.latlon = latlon;
  location.address = address;
  location.timeStamp = new Date();
  //saving location data to mongodb
  location.save(function(err, savedLocation) {
    if(err) {
      var message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    } else {
      var message="Location saved";
      res.status(201).send({'statusMessage' : 'success', 'message' : message, 'data':null});
    }
  });
}

module.exports.getLocation = function(req, res) {
  var contact = req.body.contact;
  Location.findOne({'contact' : contact},{'latlon':true}, { sort: { 'timeStamp' : -1 } }, function(err, location) {
    if (err) {
      var message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    }
    if(location == null || location.length == 0) {
      var message = "Location not available";
      res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':location});
    } else {
      console.log(location);
      var message = "Location available";
      var locations = [];
      locations.push(location);
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':locations});
    }
  });
}

module.exports.getLocations = function(req, res) {
  var contact = req.body.contact;
  Location.find({'contact' : contact}, function(err, locations) {
    if (err) {
      var message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    }
    if(locations == null || locations.length == 0) {
      var message = "Location not available";
      res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':locations});
    } else {
      var message = "Location available";
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':locations});
    }
  });
}

//share location
module.exports.shareLocation = function(req, res) {
  var userContact = req.decoded._doc.contact;
  var contact = req.body.contact;
  var location = req.body.location;

  User.findOne({'contact' :contact},{'deviceId':true}, function (err, deviceId) {
    var message;
    if (err) {
      message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message, 'data':null});
    } else {
        sendNotification(deviceId.deviceId, userContact+" shared his location", location, function(status, message) {
          res.status(status).send({'statusMessage' : 'success', 'message' : message, 'data':null});
        });
    }
  });
}

//send notification
function sendNotification(deviceId, title, location, callback) {
  // Prepare a message to be sent
  var message = new gcm.Message({
      data: { 'text' : location, 'title':title, 'share' :true }
  });
  // Specify which registration IDs to deliver the message to
  var regTokens = [];
  regTokens.push(deviceId);
  // Actually send the message
  sender.send(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) {
        console.log("Error -", err);
        callback(500, "error while sharing location");
      } else {
        console.log("Response -",response);
        callback(200, "location shared");
      }
  });
}

//hide location
module.exports.hideLocation = function(req, res) {
  var userName = req.decoded._doc.userName;
  var userContact = req.decoded._doc.contact;
  var visibility = req.body.visibility;

  LocationVisibility.findOneAndUpdate({'userName':userName, 'userContact' : userContact}, {'visibility' : visibility}, {upsert:true}, function(err, doc){
      var message="Internal server error";
      if (err) {
        return res.status(500).send({'statusMessage' : 'error', 'message' : message, 'data':null});
      }
      message = "Record updated successfully"
      return res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':null});
  });
}

//Get location visibility
module.exports.getLocationVisibility = function(req, res) {
  var userContact = req.body.contact;

  LocationVisibility.findOne({'userContact' :userContact},{'visibility':true}, function (err, visibility) {
    var message;
    if (err) {
      message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message, 'data':null});
    } else {
        message="Location visibility available";
        res.status(status).send({'statusMessage' : 'success', 'message' : message, 'data': visibility.visibility});
    }
  });
}

//check if location is hidden
module.exports.isLocationHidden = function(req, res, next) {
  var contact = req.body.contact;
  LocationVisibility.findOne({'userContact' : contact}, function(err, visibility) {
    if (err) {
      var message="Internal server error";
      return res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    }
    if(visibility == null) {
      next();
      return;
    }
    if(visibility.visibility == "close") {
      var message = "User location is hidden";
      res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':null});
    }
    if(visibility.visibility == "open") {
      next();
    }
  });
}
