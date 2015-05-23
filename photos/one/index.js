var co = require("co");
var processImages = require("../../lib/process-images");
var buildImage = require("../../lib/build-image");

var listOfImages = require("./source-images.json");
var db = require("../../lib/db")("./gpm");
var pattern = require("../../patterns/fork/pattern.json");
var pixelPicker = require("./pixel-picker");
var phraseLength = 6;
var destPath = "./img.jpg";
var seed = "#a0b090.#a0b090.#a0b0a0.#a0b090.#a0b0a0.#a0b0a0";


co(function*(){

	//yield processImages(pattern, listOfImages, phraseLength, db);
	yield buildImage(pattern, seed, pixelPicker, db, destPath);

}).catch(function(err){
	console.error(err.stack);
	throw err;
});