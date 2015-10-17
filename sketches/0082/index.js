var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json").splice(0, 10);
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var colors = require('./colors');

var BLOCK_SIZE = 5;

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

				var smallPic = ndarray([], [BLOCK_SIZE, BLOCK_SIZE, 3]);

				for(var xAdd = 0; xAdd < BLOCK_SIZE; xAdd++){
					for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
						var red = rawImg.get(xBase+xAdd, yBase+yAdd, 0);
						var green = rawImg.get(xBase+xAdd, yBase+yAdd, 1);
						var blue = rawImg.get(xBase+xAdd, yBase+yAdd, 2);

						smallPic.set(xAdd, yAdd, 0, red);
						smallPic.set(xAdd, yAdd, 1, green);
						smallPic.set(xAdd, yAdd, 2, blue);

						redAll += red;
						greenAll += green;
						blueAll += blue;

					}
				}

				var red = Math.floor(redAll / (BLOCK_SIZE * BLOCK_SIZE));
				var green = Math.floor(greenAll / (BLOCK_SIZE * BLOCK_SIZE));
				var blue = Math.floor(blueAll / (BLOCK_SIZE * BLOCK_SIZE));

				blocks.push({
					imgId: imgId,
					color: colors.encode(red, green, blue),
					img: smallPic
				});
			}
		}

		if(i % 30 === 0){
			console.log('\t', (100/listOfImages.length)*i);
		}
	}

	var numBlocks = blocks.length;

	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		console.log('building image', imgId);

		var pixels = ndarray([], [640*BLOCK_SIZE, 640*BLOCK_SIZE, 3]);

		var img = imgsById[imgId];

		for(var x=0; x<640; x++){
			for(var y=640; y<640; y++){
				var color = colors.encode(img.get(x, y, 0), img.get(x, y, 1), img.get(x, y, 2));
				var score = 0;
				var bestBlock = null;

				console.log('\tfinding block', x, y);
				for(var j=0; j<numBlocks; j++){
					var block = blocks[j];
					if(block.imgId != imgId){
						var tempScore = colors.compare(color, block.color);
						if(tempScore > score){
							bestBlock = block;
							score = tempScore;
						}
					}

					if(j % 30 === 0){
						console.log('\t\t', (100/numBlocks)*i);
					}
				}

				var xBase = x * BLOCK_SIZE;
				var yBase = y * BLOCK_SIZE;

				for(var xAdd = 0; xAdd < BLOCK_SIZE; xAdd++){
					for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
						pixels.set(xBase+xAdd, yBase+yAdd, 0, bestBlock.img.get(xAdd, yAdd, 0));
						pixels.set(xBase+xAdd, yBase+yAdd, 1, bestBlock.img.get(xAdd, yAdd, 1));
						pixels.set(xBase+xAdd, yBase+yAdd, 2, bestBlock.img.get(xAdd, yAdd, 2));
					}
				}
			}
		}

		yield saveImage(pixels, imgId);

		if(i % 30 === 0){
			console.log('\t', (100/listOfImages.length)*i);
		}
	}


}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});