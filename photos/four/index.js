var co = require("co");
var processImages = require("../../lib/image-tokenizer/markov-blocks");
var buildImage = require("../../lib/build-image");

var listOfImages = require("./source-images.json");
var db = require("../../lib/db")("./gpm");
var pattern = require("../../patterns/fork/pattern.json");
var pixelPicker = require("./pixel-picker");
var phraseLength = 25;
var destPath = "./img.jpg";
var seed = "0-10-10.10-10-10.0-10-10.20-20-20.10-10-10.10-10-10.10-10-10.20-20-20.20-20-20.20-20-20.10-10-10.10-10-10.10-10-10.10-10-10.10-10-10.10-0-10.10-10-10.10-10-10.10-10-10.10-10-10.10-10-10.10-10-10.10-10-10.10-10-10.10-10-10";
var fs = require("fs");


//I THINK THIS MIGHT REALLY BE LESS RED

co(function*(){

	//yield processImages(pattern, listOfImages, phraseLength, db);

	yield buildImage(pattern, seed, makePixelPicker(function(key){
		var red = getRed(key);
		var green = getGreen(key);
		return Math.floor((green+red)/2);
	}), db, "./space.jpg", phraseLength);

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



