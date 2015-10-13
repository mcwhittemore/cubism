var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');

var NUM_IMAGES = 'ALL';
var STRIPE_SIZE = 1;
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
				value: score,
				id: imgId
			});
		}
	}

	scores.sort(function(a, b){
		return a.value - b.value;
	});

	return scores[0].id;
}

co(function*(){

	var imgsById = {};

	console.error('loading images');
	var imgIds = [STARTER_ID];
	imgsById[STARTER_ID] = yield getBasePixels(getPath(STARTER_ID));
	timesUsed[STARTER_ID] = 0
	listOfImages.splice(listOfImages.indexOf(STARTER_ID), 1);

	NUM_IMAGES = NUM_IMAGES === 'ALL' ? listOfImages.length : NUM_IMAGES;

	var imgs = yield Promise.all(listOfImages.map(function(imgId){
		var imgPath = getPath(imgId);
		return getBasePixels(imgPath);
	}));

	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		imgIds.push(imgId);
		imgsById[imgId] = imgs[i];
		timesUsed[imgId] = 0;
	}

	var pixels = ndarray([], [640, 640, 3]);

	var currentId = null;

	for(var xBase=0; xBase<640-STRIPE_SIZE; xBase+=STRIPE_SIZE){
		console.error('drawing', xBase);
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