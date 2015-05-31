var co = require("co");
var processImages = require("../../lib/image-tokenizer/markov-blocks");
var buildImage = require("../../lib/build-image");

var listOfImages = require("./source-images.json");
var base = require("../../lib/db")("./gpm");
var filter = require("../../lib/db")("./fpm");
var pattern = require("../../patterns/block/pattern.json");
var pixelPicker = require("./pixel-picker");
var phraseLength = 25;
var destPath = "./img.jpg";
var seed = "0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0.0-0-0";
var fs = require("fs");


var filterDB = function*(from, to){
	var readStream = from.createReadStream();
	return new Promise(function(resolve, reject){
		var keys = [];
		readStream.on("data", function(data){
			var size = parseInt(data.value.match(/\"size\"\:[0-9]*/)[0].split(":")[1],10);
			console.log(data.key+": "+size+"\n");
		});

		readStream.on("end", function(){
			resolve(keys);
		});

		readStream.on("error", function(){
			readStream.end();
			reject();
		});

	});
}

//I THINK THIS MIGHT REALLY BE LESS RED

co(function*(){

	//yield processImages(pattern, listOfImages, phraseLength, base);

	// yield buildImage(pattern, seed, makePixelPicker(function(key){
	// 	var red = getRed(key);
	// 	var green = getGreen(key);
	// 	return Math.floor((green+red)/2);
	// }), db, "./space.jpg", 5);

	//yield filterDB(base, filter);
	yield buildImage(pattern, seed, pixelPicker, base, "./rand-123.jpg");

}).catch(function(err){
	console.error(err.stack);
	throw err;
});
