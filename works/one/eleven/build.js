module.exports = function*(db, cut, pattern, blockLength, destPath){
	var ndarray = require("ndarray");
	var savePixels = require("save-pixels");
	var fs = require("fs");

	var pixelToColor = function(pixel){
		var channels = pixel.split("-").map(function(v){
			return parseInt(v, 16);
		});
		return Math.abs((channels[0] << 16) | (channels[1] << 8) | (channels[2]) - ((256*256*256)/cut));
	}

	var lastPos = -1;
	var lastColor = pixelToColor("ff-00-11");
	var pickBlock = function*(id){
		var blocks = yield db.get(id);

		var block = blocks["0"];
		var pos = 0;
		var score = Math.abs(lastColor - pixelToColor(block[2], cut));
		for(var i=1; i<blocks.size; i++){
			if(i!=lastPos){
				var iBlock = blocks[i+""];
				var iScore = Math.abs(lastColor - pixelToColor(iBlock[2], cut));
				if(iScore > score){
					score = iScore;
					pos = i;
					block = iBlock;
				}
			}
		}

		lastColor = pixelToColor(block[2], cut);
		lastPos = pos;
		return block;
	}

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
	savePixels(pixels, "jpg").pipe(fs.createWriteStream(destPath));

}