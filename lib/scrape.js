var path = require('path');
var fs = require('fs');
var pictures = require('../image-sets/washington-monument-8-29-15-9-10-15.json');
var keys = Object.keys(pictures);
var request = require('request');

keys.forEach(function(key){
	console.log(path.join(__dirname, '..', 'instagrams', key+'.jpg'));
	var output = fs.createWriteStream(path.join(__dirname, '..', 'instagrams', key+'.jpg'));
	request(pictures[key]).pipe(output);
});