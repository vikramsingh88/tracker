var mongoose = require('mongoose');
var db = require('../models/db.js');
var Location = mongoose.model('Location');

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
  Location.find({'contact' : contact},{'latlon':true}, function(err, locations) {
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
