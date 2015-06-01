var co = require("co");
var processImages = require("../../lib/image-tokenizer/cordinate-blocks");
var buildImage = require("./build");
var pattern = require("../../patterns/fork/pattern.json");
var listOfImages = require("./source-images.json");
var db = require("../../lib/db")("./gpm");
var blockLength = 20;



co(function*(){

	//yield processImages(pattern, listOfImages, blockLength, db);

	yield buildImage(db, 1.5, pattern, blockLength, "./test.jpg");
	

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


