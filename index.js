/**
 * Load Twilio configuration from .env config file - the following environment
 * variables should be set:
 * process.env.TWILIO_ACCOUNT_SID
 * process.env.TWILIO_API_KEY
 * process.env.TWILIO_API_SECRET
 */
require('dotenv').load();

var http = require('http');

var express = require('express');
var cookieParser = require('cookie-parser');
var routes = require('./lib/routes');
var socket = require('./lib/socket');

/**
 * Capsulate console.log
 */
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

/**
 * Create Express app
 * Twig for view engine
 * Configuration
 */
var app = express();
app.set('views', './views');
app.set('view engine', 'twig');
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.urlencoded());

/**
 * Set routing for studio inside
 */
routes(app);
app.get('/', function(req, res) {
  res.redirect('/create');
});

app.get('/test', function(req, res) {
  res.render('test');
});

// Create http server and run it.
var server = http.createServer(app);
var port = process.env.PORT || 3000;

const io = require('socket.io')(server);
socket(io);

server.listen(port, function() {
  console.log('Express server running on *:' + port);
});