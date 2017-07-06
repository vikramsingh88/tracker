var mongoose = require('mongoose');
var db = require('../models/db.js');
var gcm = require('node-gcm');

var User = mongoose.model('User');
var Contact = mongoose.model('Contact');

var serverKey = "AAAAnFE10cY:APA91bEVBr5zQWjTavvQ-P006ZJoEriGuaW2ebHR5StVQRwJnGtLTDqeiTRfRDzUnLWBzl3S4b48PlhbR5VqpOLv-bTkmyFFzh-wBASCYb6kDRg0KFKcGQ3eIKNFtBxzt-fibEWDhPT5";
// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
var sender = new gcm.Sender(serverKey);

module.exports.requestContactForLocation = function(req, res) {
  //console.log('toekn', req.decoded);
  //console.log('user name', req.decoded._doc.userName);
  var userContact = req.decoded._doc.contact; //requester
  var contact = req.body.contact; //requestee

  //save data to user pending and contact approve field
  var newUserContact = new Contact();
  newUserContact.userContact = userContact;
  newUserContact.pending = contact;
  newUserContact.connected = '';
  newUserContact.approve = '';

  var newContact = new Contact();
  newContact.userContact = contact;
  newContact.approve = userContact;
  newContact.connected = '';
  newContact.pending = '';

  Contact.findOne({'userContact': userContact, 'pending' :contact}, function (err, contacts) {
    if (err) {
      var message = "Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    } else {
      if (contacts == null) {
        Contact.findOne({'userContact': userContact, 'connected' :contact}, function (err, contacts) {
          if (err) {
            var message = "Internal server error";
            res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
          } else {
            if (contacts == null) {
              newUserContact.save(function(err, savedUserContact) {
                if(err) {
                  var message=err;
                  res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
                } else {
                  newContact.save(function(err, savedContact) {
                    if(err) {
                      var message=err;
                      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
                    } else {
                      var message1="Request receive for location access from "+savedContact.approve;
                      var message2="Request sent to "+savedUserContact.pending+". Wait until he/she approves ";
                      //send notification
                      User.findOne({'contact' :savedContact.userContact},{'deviceId':true}, function (err, deviceId) {
                        if (err) {
                          var message=err;
                        } else {
                            sendNotification(deviceId.deviceId, 'Approve request', message1);
                        }
                      });
                      res.status(201).send({'statusMessage' : 'success', 'message' : message2, 'data':null});
                    }
                  });
                }
              });
            } else {
              var message="Already connected";
              res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':null});
            }
          }
        });
      } else {
        var message="Request has been already sent to " +contact;
        res.status(200).send({'statusMessage' : 'error', 'message' : message, 'data':null});
      }
    }
  });
}

//send notification
function sendNotification(deviceId, title, text) {
  console.log("text -", text);
  // Prepare a message to be sent
  var message = new gcm.Message({
      data: { 'text' : text, 'title':title }
  });
  // Specify which registration IDs to deliver the message to
  var regTokens = [];
  regTokens.push(deviceId);
  // Actually send the message
  sender.send(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) {
        console.log("Error -", err);
      } else {
        console.log("Response -",response);
      }
  });
}

module.exports.getPendingContacts = function(req, res) {
  var userContact = req.decoded._doc.contact;
  //console.log('userContact', userContact);
  Contact.find({'userContact' :userContact},{'pending':true}, function (err, pendings) {
    if (err) {
      var message=err;
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    } else {
      var message="pending contacts are under data attribute";
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':pendings});
    }
  });
}

module.exports.getApproveContacts = function(req, res) {
  var userContact = req.decoded._doc.contact;
  //console.log('userContact', userContact);
  Contact.find({'userContact' :userContact},{'approve':true}, function (err, approve) {
    if (err) {
      var message=err;
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    } else {
      var message="approve contacts are under data attribute";
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':approve});
    }
  });
}

module.exports.getConnectedContacts = function(req, res) {
  var userContact = req.decoded._doc.contact;
  //console.log('userContact', userContact);
  Contact.find({'userContact' :userContact},{'connected':true}, function (err, connected) {
    if (err) {
      var message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    } else {
      var message="connected contacts are under data attribute";
      res.status(200).send({'statusMessage' : 'success', 'message' : message, 'data':connected});
    }
  });
}

//update approve and pending to connected
module.exports.updateApproveToConnected = function(req, res) {
  var userContact = req.decoded._doc.contact;
  var approve = req.body.approve;
  Contact.findOneAndUpdate({'userContact' : userContact, 'approve' : approve}, {'connected' : approve, 'approve' : ''}, function(err, updated) {
    if (err) {
      var message="Internal server error";
      res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
    } else {
      Contact.findOneAndUpdate({'userContact' : approve, 'pending' : userContact}, {'connected' : userContact, 'pending' : ''}, function(err, updated) {
        if (err) {
          var message="Internal server error";
          res.status(500).send({'statusMessage' : 'error', 'message' : message,'data':null});
        } else {
          var message1 = userContact +" and "+approve+" are now connected";
          //send notification
          User.findOne({'contact' :approve},{'deviceId':true}, function (err, deviceId) {
            if (err) {
              var message=err;
            } else {
                sendNotification(deviceId.deviceId, 'Connected', message1);
            }
          });
          res.status(200).send({'statusMessage' : 'success', 'message' : message1, 'data':null});
        }
      });
    }
  });
}
