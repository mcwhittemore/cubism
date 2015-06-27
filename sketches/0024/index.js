var co = require("co");
var pattern = require("../../patterns/fork");
var listOfImages = require("./source-images.json");

var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");

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

var getColors = function(img, x, y){
	return {
		red: img.get(x, y, 0),
		green: img.get(x, y, 1),
		blue: img.get(x, y, 2)
	};
}

co(function*(){

	var IMG_SIZE = 640;
	var numImgs = listOfImages.length;
	var imgLength = IMG_SIZE * IMG_SIZE;
	var fivePercent = imgLength/20;
	var pixels = ndarray([], [IMG_SIZE, IMG_SIZE, 3]);


	var imgs = [];
	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		console.time("report");
		var img = yield getBasePixels(imgPath);
		imgs.push(img);
	}

	var fork = pattern(IMG_SIZE);

	for(var i=0; i<imgLength; i++){
		var pos = fork.next().value;
		var x = pos[0];
		var y = pos[1];

		var one = getColors(imgs[0], x, y);
		var two = getColors(imgs[1], x, y);

		var g = two.green-one.blue;

		if(g<0){
			var top = one;
			var bottom = two;
		}
		else{
			var top = two;
			var bottom = one;
		}

		var scale = Math.abs(g);

		var ts = (1/256)*scale;
		var bs = (1/256)*(256-scale);

		var red = (top.red * ts) + (bottom.red * bs);
		var green = (top.green * ts) + (bottom.green * bs);
		var blue = (top.blue * ts) + (bottom.blue * bs);

		pixels.set(x, y, 0, red);
		pixels.set(x, y, 1, green);
		pixels.set(x, y, 2, blue);

	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


