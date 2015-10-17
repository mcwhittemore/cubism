var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var colors = require('./colors');

var BLOCK_SIZE = 10;

var getBasePixels = function*(imgPath){
	return new Promise(function(accept, reject){
		getPixels(imgPath, function(err, pixels) {
			if(err) {
				reject(err);
			}
			else{
				accept(pixels);
			}
		});
	});
}

var getPath = function(imgId){
	return path.join(__dirname, "../../instagrams", imgId+".jpg");
}

var saveImage = function(pixels, imgId){
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./data/"+imgId+".jpg"));
	return new Promise(function(resolve){
		setTimeout(resolve, 200);
	});
}

co(function*(){

	var blocks = [];
	var imgsById = {};

	console.log('loading images');
	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		var rawImg = yield getBasePixels(imgPath);

		imgsById[imgId] = rawImg;

		for(var xBase=0; xBase<640; xBase+=BLOCK_SIZE){
			for(var yBase = 0; yBase < 640; yBase+=BLOCK_SIZE){

				var redAll = 0;
				var greenAll = 0;
				var blueAll = 0;

				for(var xAdd = 0; xAdd < BLOCK_SIZE; xAdd++){
					for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
						redAll += rawImg.get(xBase+xAdd, yBase+yAdd, 0);
						greenAll += rawImg.get(xBase+xAdd, yBase+yAdd, 1);
						blueAll += rawImg.get(xBase+xAdd, yBase+yAdd, 2);
					}
				}

				var red = Math.floor(redAll / (BLOCK_SIZE * BLOCK_SIZE));
				var green = Math.floor(greenAll / (BLOCK_SIZE * BLOCK_SIZE));
				var blue = Math.floor(blueAll / (BLOCK_SIZE * BLOCK_SIZE));

				blocks.push({
					imgId: imgId,
					color: colors.encode(red, green, blue),
					x: xBase,
					y: yBase
				});
			}
		}

		if(i % 30 === 0){
			console.log('\t', (100/listOfImages.length)*i);
		}

		rawImg = null;
	}

	var numBlocks = blocks.length;

	var blocksPerImg = Math.pow(Math.floor(640 / BLOCK_SIZE), 2);

	console.log(blocksPerImg);

	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		console.log('building image', imgId);

		var pixels = ndarray([], [640, 640, 3]);
		var others = [].concat(blocks);
		var mine = others.splice(i*blocksPerImg, i*blocksPerImg+blocksPerImg);

		var x = 0;
		var y = 0;

		for(var k=0; k<blocksPerImg; k++){
			var baseBlock = mine[k];
			var score = 0;
			var bestMatch = null;

			for(var j=0; j<others.length; j++){
				var otherBlock = others[j];
				var val = colors.compare(baseBlock.color, otherBlock.color);
				if(val>score){
					bestMatch = otherBlock
					score = val;
				}
			}

			var img = imgsById[bestMatch.imgId];

			for(var xAdd=0; xAdd < BLOCK_SIZE; xAdd++){
				for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
					pixels.set(x+xAdd, y+yAdd, 0, img.get(bestMatch.x + xAdd, bestMatch.y + yAdd, 0));
					pixels.set(x+xAdd, y+yAdd, 1, img.get(bestMatch.x + xAdd, bestMatch.y + yAdd, 1));
					pixels.set(x+xAdd, y+yAdd, 2, img.get(bestMatch.x + xAdd, bestMatch.y + yAdd, 2));
				}
			}

			y += BLOCK_SIZE;

			if(y >= 640){
				y = 0;
				x += BLOCK_SIZE;
			}

			if(k % 30 === 0){
				console.log('\t', (100/blocksPerImg)*k);
			}
		}

		yield saveImage(pixels, imgId);
	}


}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});