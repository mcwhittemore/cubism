var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");

module.exports = function*(pattern, seed, pixelPicker, db, destPath){
	console.log("Building Image");

	var keyBits = seed.split(".");
	var list = [];

	for(var i=0; i<keyBits.length; i++){
		list.push([pattern[i][0], pattern[i][1], keyBits[i]]);
	}

	var tenp = Math.floor(pattern.length / 20);

	process.stdout.write("\tSelecting pixels:");
	console.time("select-pixels");
	for(var i=keyBits.length-1; i<pattern.length; i++){
		var baseKey = yield pixelPicker(seed, db);
		var baseBits = baseKey.split(".");
		seed = baseKey;

		list = list.concat(hashToArray(baseBits[baseBits.length-1]));

		if(i%tenp==0){
			process.stdout.write(" "+Math.ceil((100/pattern.length)*i));
		}
	}
	console.timeEnd("select-pixels");

	var pixels = ndarray(list, [640, 640, 3]);

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

