var co = require("co");
var processImages = require("../../lib/process-images");
var buildImage = require("../../lib/build-image");

var listOfImages = require("./source-images.json");
var db = require("../../lib/db")("./gpm");
var pattern = require("../../patterns/fork/pattern.json");
var pixelPicker = require("./pixel-picker");
var phraseLength = 6;
var destPath = "./img.jpg";
var seed = "e0-a0-80.b0-70-50.a0-70-60.a0-70-60.b0-70-60.a0-70-50";


//I THINK THIS MIGHT REALLY BE LESS RED

co(function*(){

	//yield processImages(pattern, listOfImages, phraseLength, db);
	
	var gen = require("random-seed");
	var rand = gen.create("123");
	yield buildImage(pattern, seed, makePixelPicker(function(key){
		return rand(1000);
	}), db, "./rand-123.jpg");

	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var blue = getBlue(key);
		return Math.floor((red+blue)/2);
	}), db, "./aqua.jpg");

	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var green = getGreen(key);
		var blue = getBlue(key);
		var all = Math.floor((red+green+blue)/3);
		return 255 - all;
	}), db, "./white.jpg");
	
	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var green = getGreen(key);
		return Math.floor((green+red)/2);
	}), db, "./space.jpg");
	
	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var blue = getBlue(key);
		return red/blue;
	}), db, "./redOverBlue.jpg");

}).catch(function(err){
	console.error(err.stack);
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



