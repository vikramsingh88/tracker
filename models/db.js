var mongoose = require('mongoose');
var dbURI = 'mongodb://localhost/tracker';
//var dbURI = 'mongodb://vikram:password@ds161059.mlab.com:61059/chat';

mongoose.connect(dbURI);

mongoose.connection.on('connected', function() {
	console.log('Mongoose connected to '+dbURI);
});

mongoose.connection.on('error', function(err) {
	console.log('Mongoose connection error '+err);
});

mongoose.connection.on('disconnected', function() {
	console.log('Mongoose disconnected');
});

// user data
var userSchema = new mongoose.Schema({
		userName: { type: String, unique: true },
		password: {type: String},
		location: {type: String},
		contact: {type: String, unique: true},
		deviceId: {type: String},
		timeStamp :{ type : Date, default: Date.now }
});

// Build the User model
mongoose.model('User', userSchema);

//Contact data
var contactSchema = new mongoose.Schema({
		userContact: {type: String},
		connected: {type: String},
		pending: {type: String},
		approve: {type: String}
});

// Build the Contact model
mongoose.model('Contact', contactSchema);

//location data
var locationSchema = new mongoose.Schema({
	userName : {type: String},
	contact : {type: String},
	latlon : {type: String},
	address : {type: String},
	timeStamp : { type : Date, default: Date.now}
});
//Build location model
mongoose.model('Location', locationSchema);
