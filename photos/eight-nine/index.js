var co = require("co");

var pattern = require("../../patterns/fork/pattern.json");
var blockLength = 6;

var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");

var pixelToColor = function(pixel){
	var channels = pixel.split("-").map(function(v){
		return parseInt(v, 16);
	});
	return Math.abs((channels[0] << 16) | (channels[1] << 8) | (channels[2]) - ((256*256*256)/2));
}

var db = {
	eight: require("../../lib/db")("../eight/gpm"),
	nine: require("../../lib/db")("../nine/gpm")
};

var lastColor = {
	eight: pixelToColor("ff-00-11"),
	nine: pixelToColor("ff-00-11")
}

var pic = "nine";

var pickBlock = function*(id){
	var blocks = yield db[pic].get(id);

	var block = blocks["0"];
	var score = Math.abs(lastColor[pic] - pixelToColor(block[2]));
	for(var i=1; i<blocks.size; i++){
		var iBlock = blocks[i+""];
		var iScore = Math.abs(lastColor[pic] - pixelToColor(iBlock[2]));
		if(iScore > score){
			score = iScore;
			block = iBlock;
		}
	}

	lastColor[pic] = pixelToColor(block[2]);
	pic = pic == "eight" ? "nine" : "eight";
	return block;
}

var lastId = null;
var findBlock = function(id){
	if(pic=="nine"){
		lastId = id;
		return pickBlock(id);
	}
	else{
		return pickBlock(lastId);
	}
}

co(function*(){

	//yield processImages(pattern, listOfImages, blockLength, db);

	var pixels = ndarray([], [640, 640, 3]);
	for(var i=0; i<pattern.length; i+=blockLength){
		var block = yield pickBlock("B-"+i);

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
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


