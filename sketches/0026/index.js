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


	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		console.time("report");
		var img = yield getBasePixels(imgPath);
		console.timeEnd("report");

		var lastReport = 0;
		var fork = pattern(IMG_SIZE);
		var poss = [];
		console.time("report");
		for(var i=0; i<imgLength; i++){
			var newPos = fork.next().value;

			var x = newPos[0];
			var y = newPos[1];

			poss.push(newPos);
			if(poss.length == 10){
				poss = poss.slice(1);
			}

			var total = [0, 0, 0];
			for(var j=0; j<poss.length; j++){
				var pos = poss[j];
				total[0] = total[0] + img.get(pos[0], pos[1], 0);
				total[1] = total[1] + img.get(pos[0], pos[1], 1);
				total[2] = total[2] + img.get(pos[0], pos[1], 2);
			}

			var red = Math.abs(total[0] / poss.length);
			var green = Math.abs(total[1] / poss.length);
			var blue = Math.abs(total[2] / poss.length);

			if(b>0){
				red = red + pixels.get(x, y, 0);
				green = green + pixels.get(x, y, 1);
				blue = blue + pixels.get(x, y, 2);
			}

			pixels.set(x, y, 0, red);
			pixels.set(x, y, 1, green);
			pixels.set(x, y, 2, blue);

			if(i>lastReport+fivePercent){
				console.log((100/imgLength)*i);
				lastReport = i;
				console.timeEnd("report");
				console.time("report");
			}

		}
	}

	console.log("averaging the pixels");
	var lastReport = 0;
	var fork = pattern(IMG_SIZE);
	var min = 300;
	for(var i=0; i<imgLength; i++){
		var newPos = fork.next().value;

		var x = newPos[0];
		var y = newPos[1];

		red = pixels.get(x, y, 0);
		green = pixels.get(x, y, 1);
		blue = pixels.get(x, y, 2);

		red = Math.floor(red / numImgs);
		green = Math.floor(green / numImgs);
		blue = Math.floor(blue / numImgs);

		var all = red + green + blue;
		if(isNaN(all)){
			console.log("----------------");
			console.log(pixels.get(x, y, 0), pixels.get(x, y, 1), pixels.get(x, y, 2));
			console.log(numImgs);
		}

		min = Math.min(red, green, blue, min);

		pixels.set(x, y, 0, red);
		pixels.set(x, y, 1, green);
		pixels.set(x, y, 2, blue);

		if(i>lastReport+fivePercent){
			console.log((100/imgLength)*i);
			lastReport = i;
		}
	}
	

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


