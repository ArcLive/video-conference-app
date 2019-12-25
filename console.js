
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/console.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var storage = require('./lib/storage');

console.log(storage.create_room());