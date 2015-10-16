var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json").splice(0, 200);
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var mathImg = require('./math-img');

var STRIPE_SIZE = 5;
var NUM_SECTIONS = Math.floor(640 / STRIPE_SIZE);

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

var findNext = function(imgs){

	return function(img, section, percentCovered){

		var bestImg = null;
		var bestSection = null;
		var score = 0;

		for(var i=0; i<imgs.length; i++){

			if(img !== imgs[i]){
				var info = img.math.findSectionMostLikeSection(section, imgs[i].math, function(score, section){
					var distance = Math.pow(1 - Math.abs(percentCovered - ((1/img.math.numSections) * section)), 2);
					return score * distance;
				});

				if(info.score > score){
					bestImg = i;
					bestSection = info.section;
					score = info.score;
				}
			}

		}

		return {
			img: imgs[bestImg],
			section: bestSection
		}

	}

}

var saveImage = function(pixels, imgId){
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./data/"+imgId+".jpg"));
	return new Promise(function(resolve){
		setTimeout(resolve, 200);
	});
}

co(function*(){

	var imgs = [];

	console.log('loading images');
	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		var rawImg = yield getBasePixels(imgPath);
		var math = mathImg(rawImg, STRIPE_SIZE, 'down');
		imgs.push({
			raw: rawImg,
			math: math,
			id: imgId
		});

		if(i % 30 === 0){
			console.log('\t', (100/listOfImages.length)*i);
		}
	}

	var finder = findNext(imgs);

	var width = 1920;

	for(var i=0; i<imgs.length; i++){
		console.time('startImg');
		var pixels = ndarray([], [width, 640, 3]);

		var img = imgs[i];
		var saveId = img.id;

		console.log('making', saveId, i, 'of', imgs.length);

		var imgSection = 0;
		for(var xBase=0; xBase<=width/2; xBase+=STRIPE_SIZE) {
			var percentCovered = (1/width) * xBase;
			if(xBase>0){
				var next = finder(img, imgSection, percentCovered);
				img = next.img;
				imgSection = next.section;
			}

			for(var xAdd = 0; xAdd < STRIPE_SIZE; xAdd++){
				var x = xBase + xAdd;
				var xSection = (imgSection * STRIPE_SIZE) + xAdd;
				for(var y = 0; y<640; y++){
					pixels.set(x, y, 0, img.raw.get(xSection, y, 0));
					pixels.set(x, y, 1, img.raw.get(xSection, y, 1));
					pixels.set(x, y, 2, img.raw.get(xSection, y, 2));
				}
			}

			if(xBase % 50 === 0){
				console.log((100/width)*xBase);
			}
		}

		var imgSection = NUM_SECTIONS-1;
		for(var xBase=width-STRIPE_SIZE; xBase>width/2; xBase-=STRIPE_SIZE) {
			var percentCovered = (1/width) * xBase;

			var next = finder(img, imgSection, percentCovered);
			img = next.img;
			imgSection = next.section;

			for(var xAdd = 0; xAdd < STRIPE_SIZE; xAdd++){
				var x = xBase + xAdd;
				var xSection = (imgSection * STRIPE_SIZE) + xAdd;
				for(var y = 0; y<640; y++){
					pixels.set(x, y, 0, img.raw.get(xSection, y, 0));
					pixels.set(x, y, 1, img.raw.get(xSection, y, 1));
					pixels.set(x, y, 2, img.raw.get(xSection, y, 2));
				}
			}

			if(xBase % 50 === 0){
				console.log((100/width)*xBase);
			}
		}

		console.timeEnd('startImg');
		console.log('\n---\n');
		yield saveImage(pixels, saveId);
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});