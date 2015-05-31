var co = require("co");
var processImages = require("../../lib/image-tokenizer/markov-chain");
var buildImage = require("../../lib/build-image");

var listOfImages = require("./source-images.json");
var db = require("../../lib/db")("./gpm");
var pattern = require("../../patterns/fork/pattern.json");
var pixelPicker = require("./pixel-picker");
var phraseLength = 25;
var seed = "90-80-80.30-20-20.70-60-60.10-0-0.30-20-20.a0-90-90.70-60-60.10-0-10.90-80-80.30-20-30.10-10-10.70-60-70.60-50-60.10-10-10.30-20-20.60-50-60.20-20-20.10-0-10.20-20-20.50-50-50.20-10-20.90-80-80.70-60-70.10-0-10.40-40-40";


//I THINK THIS MIGHT REALLY BE LESS RED

co(function*(){

	// yield processImages(pattern, listOfImages, phraseLength, db);

	// var keyStream = db.createKeyStream();

	// keyStream.on("data", function(key){
	// 	console.log(key);
	// });

	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var green = getGreen(key);
		return Math.floor((green+red)/2);
	}), db, "./space.jpg");
	
	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var blue = getBlue(key);
		return Math.floor((red+blue)/2);
	}), db, "./aqua.jpg");
	
	var gen = require("random-seed");
	var rand = gen.create("123");
	yield buildImage(pattern, seed, makePixelPicker(function(key){
		return rand(1000);
	}), db, "./rand-123.jpg");

	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var green = getGreen(key);
		var blue = getBlue(key);
		var all = Math.floor((red+green+blue)/3);
		return 255 - all;
	}), db, "./white.jpg");
	
	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var blue = getBlue(key);
		return red/blue;
	}), db, "./redOverBlue.jpg");

}).catch(function(err){
	console.error(err);
	throw err;
});


function makePixelPicker(getVal){
	return function* (search, db){
		return yield pixelPicker(search, db, getVal);
	}
}

function getRed(key){
	return parseInt(key.split(".")[5].split("-")[0],16);
}

function getGreen(key){
	return parseInt(key.split(".")[5].split("-")[1],16);
}

function getBlue(key){
	return parseInt(key.split(".")[5].split("-")[0],16);
}



