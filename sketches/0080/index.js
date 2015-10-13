var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');

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

var findNext = function(current, imgIds, imgsById, pos){
	var next = current;
	while(next === current){
		var i = Math.floor(Math.random()*imgIds.length);
		next = imgIds[i];
	}
	return next;
}

co(function*(){
	var NUM_IMAGES = 20;
	var STRIPE_SIZE = 10;

	var imgsById = {};

	var imgIds = ['7LGTA1q57n'];
	imgsById['7LGTA1q57n'] = yield getBasePixels(getPath('7LGTA1q57n'));
	while(imgIds.length < NUM_IMAGES){
		var i = Math.floor(Math.random()*listOfImages.length);
		var imgId = listOfImages[i];
		if(imgIds.indexOf(imgId) === -1){
			imgIds.push(imgId);
			var imgPath = getPath(imgId);
			var img = yield getBasePixels(imgPath);
			imgsById[imgId] = img;
		}
	}

	var pixels = ndarray([], [640, 640, 3]);

	var currentId = '7LGTA1q57n';

	for(var xBase=0; xBase<640-STRIPE_SIZE; xBase+=STRIPE_SIZE){
		var img = imgsById[currentId];
		for(var xAdd = 0; xAdd < STRIPE_SIZE; xAdd++){
			var x = xBase + xAdd;
			for(var y = 0; y<640; y++){
				pixels.set(x, y, 0, img.get(x, y, 0));
				pixels.set(x, y, 1, img.get(x, y, 1));
				pixels.set(x, y, 2, img.get(x, y, 2));
			}
		}

		currentId = findNext(currentId, imgIds, imgsById, xBase+STRIPE_SIZE);
	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./end.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});