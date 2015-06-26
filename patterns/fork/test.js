var fork = require("./index");

var size = 3600;
var f = fork(size);
var count = 0;
var done = false;

var full = size*size;
var op = full/100;
var fp = op*5;
var lr = 0;

while(!done){
	var v = f.next();
	done = v.done;
	count++;
	if(lr+fp<count){
		lr = count;
		console.log(count/full);
	}
}

console.log("full", full, "count", count);