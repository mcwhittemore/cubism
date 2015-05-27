var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");

module.exports = function*(pattern, seed, pixelPicker, db, destPath, blockIterationSize){
	blockIterationSize = blockIterationSize || 1;
	console.log("Building Image");

	var keyBits = seed.split(".");
	var pixels = ndarray([], [640, 640, 3]);

	for(var i=0; i<keyBits.length; i++){
		var channels = hashToArray(keyBits[i]);
		for(var j=0; j<channels.length; j++){
			pixels.set(pattern[i][0], pattern[i][1], j, channels[j]);
		}
	}

	var tenp = Math.floor(pattern.length / 20);

	process.stdout.write("\tSelecting pixels:");
	console.time("select-pixels");
	for(var i=keyBits.length-1; i<pattern.length; i+=blockIterationSize){
		var baseKey = yield pixelPicker(seed, db);
		var baseBits = baseKey.split(".");
		seed = baseKey;

		// can I make this a nested loop
		// and have the child loop
		// walk over the items needed in the list

		for(var k=0; k<blockIterationSize; k++){
			var bitIndex = baseBits.length-(blockIterationSize-k)-1;
			var channels = hashToArray(baseBits[bitIndex]);
			for(var j=0; j<channels.length; j++){
				pixels.set(pattern[i+k][0], pattern[i+k][1], j, channels[j]);
			}
		}



		if(i%tenp==0){
			process.stdout.write(" "+Math.ceil((100/pattern.length)*i));
		}
	}
	console.timeEnd("select-pixels");

	process.stdout.write("\tSelecting pixels:");
	console.time("saving-image");
	savePixels(pixels, "jpg").pipe(fs.createWriteStream(destPath));
	console.timeEnd("saving-image");

}

function hashToArray(hash){
	var bits = hash.split("-");
	var out = [];
	for(var i=0; i<bits.length; i++){
		out.push(parseInt(bits[i], 16));
	}
	return out;
}

