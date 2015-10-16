var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');

var STRIPE_SIZE = 5;

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

	return function(img, section){

		var bestImg = null;
		var bestSection = null;
		var score = 0;

		for(var i=0; i<imgs.length; i++){
			if(imgs[i] !== img){
				var info = img.math.findSectionMostLikeSection(section, imgs[i].math);

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
		var mathImg = mathImg(rawImg, STRIPE_SIZE, 'down');
		imgs.push({
			raw: rawImg,
			math: mathImg,
			id: imgId
		});

		if(i % 30 === 0){
			console.log('\t', (100/listOfImages.length)*i);
		}
	}

	var finder = findNext(imgs);

	for(var i=0; i<imgs.length; i++){
		var pixels = ndarray([], [640, 640, 3]);

		var img = imgs[i];
		var saveId = img.id;

		console.log('making', saveId, i, 'of', imgs.length);

		var imgSection = 0;
		for(var xBase=0; xBase<640; xBase+=STRIPE_SIZE) {
			if(xBase>0){
				var next = finder(img, imgSection);
				img = next.img;
				imgSection = next.section;
			}

			for(var xAdd = 0; xAdd < STRIPE_SIZE; xAdd++){
				var x = xBase + xAdd;
				var xSection = (imgSection * STRIPE_SIZE) + xBase;
				for(var y = 0; y<640; y++){
					pixels.set(x, y, 0, img.raw.get(xSection, y, 0));
					pixels.set(x, y, 1, img.raw.get(xSection, y, 1));
					pixels.set(x, y, 2, img.raw.get(xSection, y, 2));
				}
			}

			console.log('\t', xBase);
		}

		yield saveImage(pixels, saveId);
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});