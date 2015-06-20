var co = require("co");
var processImages = require("../../lib/image-tokenizer/cordinate-blocks");
var pattern = require("../../patterns/fork/pattern.json");
var listOfImages = require("./source-images.json");
var db = require("../../lib/db")("./gpm");
var blockLength = 6;

var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");

var pixelToColor = function(pixel){
	var channels = pixel.split("-").map(function(v){
		return parseInt(v, 16);
	});

	var red = Math.abs(channels[0] - parseInt("C4", 16));
	var green = Math.abs(channels[1] - parseInt("CC", 16));
	var blue = Math.abs(channels[2] - parseInt("D9", 16));

	return (red << 16) | (green << 8) | (blue);
	
}

var lastPos = -1;
var lastColor = pixelToColor("ff-00-11") / 2;
var pickBlock = function*(id, div, channel){
	var blocks = yield db.get(id);

	var block = blocks["0"];
	var pos = 0;
	var score = Math.abs(lastColor - pixelToColor(block[channel]));
	for(var i=1; i<blocks.size; i++){
		if(i!=lastPos){
			var iBlock = blocks[i+""];
			var iScore = Math.abs(lastColor - pixelToColor(iBlock[channel]));
			if(iScore > score){
				score = iScore;
				pos = i;
				block = iBlock;
			}
		}
	}

	lastColor = pixelToColor(block[channel]) / div;
	lastPos = pos;
	return block;
}

var crushIt = function* (div, channel){
	var pixels = ndarray([], [640, 640, 3]);
	for(var i=0; i<pattern.length; i+=blockLength){
		var block = yield pickBlock("B-"+i, div, channel);

		for(var k=0; k<blockLength; k++){
			var pixel = block[k];
			if(pixel!==null){
				var channels = pixel.split("-").map(function(v){
					return parseInt(v, 16);
				});

				pixels.set(pattern[i+k][0], pattern[i+k][1], 0, channels[0]);
				pixels.set(pattern[i+k][0], pattern[i+k][1], 1, channels[1]);
				pixels.set(pattern[i+k][0], pattern[i+k][1], 2, channels[2]);
			}
		}

	}
	return pixels
}

co(function*(){

	//yield processImages(pattern, listOfImages, blockLength, db);

	var pixels = yield crushIt(1, 2);
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


