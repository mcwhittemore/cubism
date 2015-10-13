var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');

var NUM_IMAGES = 300;
var STRIPE_SIZE = 5;
var STARTER_ID = '7LGTA1q57n';

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

var timesUsed = {};

var findNext = function(currentId, imgIds, imgsById, x){
	console.log('\tfinding...');
	var scores = [];
	timesUsed[currentId]+=STRIPE_SIZE;

	for(var i=0; i<imgIds.length; i++){
		var imgId = imgIds[i];
		if(imgId !== currentId){
			var score = 0;
			for(var y=0; y<640; y++){
				for(var c=0; c<3; c++){
					var left = imgsById[currentId].get(x, y, c);
					var right = imgsById[imgId].get(x, y, c);
					score += Math.abs(left-right);
				}
			}
			scores.push({
				value: score * (timesUsed[imgId]+1),
				id: imgId
			});
		}
	}

	scores.sort(function(a, b){
		return a.value - b.value;
	});

	console.log('\tfound');
	return scores[0].id;
}

var isWhite = function(img, x, y){
	return img.get(x, y, 0) > 250 && img.get(x, y, 1) > 250 && img.get(x, y, 2) > 250;
}

co(function*(){

	var imgsById = {};

	console.log('loading images');
	var imgIds = [STARTER_ID];
	imgsById[STARTER_ID] = yield getBasePixels(getPath(STARTER_ID));
	timesUsed[STARTER_ID] = 0
	while(imgIds.length < NUM_IMAGES){
		var i = Math.floor(Math.random()*listOfImages.length);
		var imgId = listOfImages[i];
		if(imgIds.indexOf(imgId) === -1){
			var imgPath = getPath(imgId);
			var img = yield getBasePixels(imgPath);
			if(!isWhite(img, 320, 0) && !isWhite(img, 0, 320)){
				imgIds.push(imgId);
				imgsById[imgId] = img;
				timesUsed[imgId] = 0;
			}
		}
	}

	var pixels = ndarray([], [640, 640, 3]);

	var currentId = null;

	for(var xBase=0; xBase<640-STRIPE_SIZE; xBase+=STRIPE_SIZE){
		console.log('drawing', xBase);
		currentId = currentId ? findNext(currentId, imgIds, imgsById, xBase) : STARTER_ID;
		var img = imgsById[currentId];
		for(var xAdd = 0; xAdd < STRIPE_SIZE; xAdd++){
			var x = xBase + xAdd;
			for(var y = 0; y<640; y++){
				pixels.set(x, y, 0, img.get(x, y, 0));
				pixels.set(x, y, 1, img.get(x, y, 1));
				pixels.set(x, y, 2, img.get(x, y, 2));
			}
		}
	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./end.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});