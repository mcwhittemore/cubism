var co = require("co");
var pattern = require("../../patterns/block/pattern.json");
var listOfImages = require("./source-images.json");
var imgToSentence = require("../../lib/image-tokenizer/tools/img-to-sentence");

var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");
var path = require("path");

co(function*(){

	var imgs = [];
	var numImgs = listOfImages.length;
	for(var i=0; i<numImgs; i++){
		var imgId = listOfImages[i];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+i+" of "+numImgs);
		var img = yield imgToSentence(pattern, imgPath);
		imgs.push(img);
	}

	var getScore = function(word){
		var channels = word.split("-").map(function(v){
			return parseInt(v, 16);
		});
		return Math.abs((channels[0] << 16) | (channels[1] << 8) | (channels[2]) - ((256*256*256)/2));
	}

	var imgLength = imgs[0].length;
	var fivePercent = imgLength/20;
	var lastReport = 0;

	var lastScore = 0;

	var pixels = ndarray([], [640, 640, 3]);
	for(var i=0; i<imgLength; i++){

		var imgIndex = 0;
		var score = getScore(imgs[0][i]);
		for(var k=1; k<numImgs; k++){
			var is = getScore(imgs[k][i]);
			var csv = Math.abs(lastScore - is);
			var lsv = Math.abs(lastScore - score);

			if(csv > lsv){
				score = is;
				imgIndex = k;
			}
		}

		lastScore = score;


		var colors = imgs[imgIndex][i].split("-");
		var red = parseInt(colors[0], 16);
		var green = parseInt(colors[1], 16);
		var blue = parseInt(colors[2], 16);
		
		var x = pattern[i][0];
		var y = pattern[i][1];

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


