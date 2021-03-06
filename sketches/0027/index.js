var sketchSaver = require("../../lib/sketch-saver");
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

var getAvg = function(imgs, x, y){
	var total = {
		red: 0,
		green: 0,
		blue: 0
	}

	for(var i=0; i<imgs.length; i++){
		var v = getColors(imgs[i], x, y);
		total.red += v.red;
		total.green += v.green;
		total.blue += v.blue;
	}

	return {
		red: total.red / imgs.length,
		green: total.green / imgs.length,
		blue: total.blue / imgs.length,
		x: x,
		y: y
	}
}

var findClose = function(imgs, avg, cords){
	var colors = [];
	for(var i=0; i<imgs.length; i++){
		var color = getColors(imgs[i], cords.x, cords.y);

		var redDif = Math.abs(avg.red - color.red);
		var greenDif = Math.abs(avg.green - color.green);
		var blueDif = Math.abs(avg.blue - color.blue);

		color.score = blueDif;// + greenDif + blueDif;
		colors.push(color);
	}

	colors.sort(function(a, b){
		return a.score - b.score;
	});

	return colors[0];
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

	var avgs = [];
	for(var i=0; i<imgLength; i++){
		var pos = fork.next().value;
		var x = pos[0];
		var y = pos[1];
		avgs.push(getAvg(imgs, x, y));
	}

	for(var i=0; i<imgLength; i++){
		var left = i - 3 < 0 ? 0 : i - 3;
		var right = i + 3 >= imgLength ? imgLength-1 : i + 3;

		var leftAvg = avgs[left];
		var rightAvg = avgs[right];

		var redDif = leftAvg.red - rightAvg.red;
		var greenDif = leftAvg.green - rightAvg.green;
		var blueDif = leftAvg.blue - rightAvg.blue;

		var midAvg = {
			red: leftAvg.red + redDif,
			green: leftAvg.green + greenDif,
			blue: leftAvg.blue + blueDif,
		}

		var close = findClose(imgs, midAvg, avgs[i]);

		pixels.set(avgs[i].x, avgs[i].y, 0, close.red);
		pixels.set(avgs[i].x, avgs[i].y, 1, close.green);
		pixels.set(avgs[i].x, avgs[i].y, 2, close.blue);
	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});


