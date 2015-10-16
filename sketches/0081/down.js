var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var mathImg = require('./math-img');

var STRIPE_SIZE = 5;
var NUM_SECTIONS = Math.floor(1920 / STRIPE_SIZE);

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
	return path.join(__dirname, "data", imgId+".jpg");
}

var findNext = function(imgs){

	return function(img, section, percentCovered){

		var bestImg = null;
		var bestSection = null;
		var score = 0;

		for(var i=0; i<imgs.length; i++){

			if(img !== imgs[i]){
				var info = img.math.findSectionMostLikeSection(section, imgs[i].math, function(score, section){
					var distance = 1 - Math.abs(percentCovered - ((1/img.math.numSections) * section));
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
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./down/"+imgId+".jpg"));
	return new Promise(function(resolve){
		setTimeout(resolve, 200);
	});
}

co(function*(){

	var listOfImages = (yield new Promise(function(resolve, reject){
		fs.readdir(path.join(__dirname, "data"), function(err, files){
			if(err){
				reject(err);
			}
			else{
				resolve(files);
			}
		});
	})).reduce(function(v, name){
		var data = name.split('.');
		if(data[1] === 'jpg'){
			v.push(data[0]);
		}
		return v;
	}, []);

	var imgs = [];

	console.log('loading images');
	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		var rawImg = yield getBasePixels(imgPath);
		var math = mathImg(rawImg, STRIPE_SIZE, 'across');
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

	var width = 1280;

	for(var i=0; i<imgs.length; i++){
		console.time('startImg');
		var pixels = ndarray([], [1920, width, 3]);

		var img = imgs[i];
		var saveId = img.id;

		console.log('making', saveId, i, 'of', imgs.length);

		var imgSection = 0;
		for(var yBase=0; yBase<width; yBase+=STRIPE_SIZE) {
			var percentCovered = (1/width) * yBase;
			if(yBase>0){
				var nextSection = imgSection + 1 === NUM_SECTIONS ? 0 : imgSection + 1;
				var next = finder(img, nextSection, percentCovered);
				img = next.img;
				imgSection = next.section;
			}

			for(var yAdd = 0; yAdd < STRIPE_SIZE; yAdd++){
				var y = yBase + yAdd;
				var ySection = (imgSection * STRIPE_SIZE) + yAdd;
				for(var x = 0; x<1920; x++){
					pixels.set(x, y, 0, img.raw.get(x, ySection, 0));
					pixels.set(x, y, 1, img.raw.get(x, ySection, 1));
					pixels.set(x, y, 2, img.raw.get(x, ySection, 2));
				}
			}

			if(yBase % 50 === 0){
				console.log((100/width)*yBase);
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