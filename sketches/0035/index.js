var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var pattern = require("../../patterns/fork");
var smudge = require("../../lib/blending/smudger");
var box = require("../../lib/selectors/box");
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
	
	var next = fork.next();
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var redTotal = 0;
		var greenTotal = 0;
		var blueTotal = 0;

		var maxTotal = 0;
		var midTotal = 0;

		for(var i=0; i<numImgs; i++){
			var colors = getColors(imgs[i], x, y);

			redTotal = redTotal + colors.red;
			greenTotal = greenTotal + colors.green;
			blueTotal = blueTotal + colors.blue;

			var max = Math.max(colors.red, colors.green, colors.blue);
			var mid = [colors.red, colors.green, colors.blue].sort()[1];

			maxTotal = maxTotal + max;
			midTotal = midTotal + mid;
		}

		var dist = [
			{
				value: redTotal,
				channel: 0
			},
			{
				value: greenTotal,
				channel: 1
			},
			{
				value: blueTotal,
				channel: 2
			}
		];

		dist.sort(function(a, b){
			return a.value - b.value;
		});

		var maxAvg = Math.floor(maxTotal / numImgs);
		var midAvg = Math.floor(midTotal / numImgs);
		var min = Math.floor(dist[2].value / numImgs);

		pixels.set(x, y, dist[0].channel, maxAvg);
		pixels.set(x, y, dist[1].channel, midAvg);
		pixels.set(x, y, dist[2].channel, min);

		next = fork.next();
	}

	console.log("writing");
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});


