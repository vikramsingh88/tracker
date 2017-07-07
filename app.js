var express = require('express');
var bodyParser = require('body-parser');
var user = require('./routes/user.js');
var contact = require('./routes/contacts.js');
var tockenChecker = require('./routes/tokenchecker.js');
var location = require('./routes/location.js');

var app = express();
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

var port = process.env.PORT || 8080;

//Check if user already exist
app.post('/checkIfUserExist', user.userExist);
//Create new user
app.post('/registration', user.createNewUser);
//Authenticate
app.post('/authenticate', user.authenticate);

app.use(tockenChecker.verifyToken); // all routes after that require token

//Check if contact exist
app.post('/checkIfContactExist', user.contactExist);
//Get all user
app.get('/users', user.getAllUsers);
app.post('/updatedeviceid', user.updateUserDeviceId);
//Request contact location request
app.post('/requestlocation', contact.requestContactForLocation);
app.post('/getpendingcontacts', contact.getPendingContacts);
app.post('/getapprovecontacts', contact.getApproveContacts);
app.post('/getconnectedcontacts', contact.getConnectedContacts);
app.post('/connect', contact.updateApproveToConnected);
app.post('/addlocation', location.saveLocation);
app.post('/getlocation', location.isLocationHidden, location.getLocation);
app.post('/sharelocation', location.shareLocation);
app.post('/hidelocation', location.hideLocation);
app.post('/getlocationvisibility', location.getLocationVisibility);
//for error handling
app.use(function(req, res) {
     res.status(404).send('404 Page not found');
});

app.use(function(error, req, res, next) {
     res.status(500).send('500 Server internal error');
});

//start server on PORT
app.listen(port, function() {
  console.log('Server is running on port ',port);
});
