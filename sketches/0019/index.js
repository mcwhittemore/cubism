var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var pattern = require("../../patterns/fork/pattern.json");
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

	var imgLength = imgs[0].length;
	var fivePercent = imgLength/20;
	var lastReport = 0;

	var pixels = ndarray([], [640, 640, 3]);
	for(var i=0; i<imgLength; i++){

		var total = [0, 0, 0];
		var count = 0;
		for(var k=0; k<numImgs; k++){
			for(var j=i-3; j<i+3; j++){
				var word = imgs[k][j];
				if(word){
					count++;
					var colors = word.split("-");
					total[0] = total[0] + parseInt(colors[0], 16);
					total[1] = total[1] + parseInt(colors[1], 16);
					total[2] = total[2] + parseInt(colors[2], 16);
				}
			}
		}

		var red = Math.abs(total[0] / count);
		var green = Math.abs(total[1] / count);
		var blue = Math.abs(total[2] / count);
		
		var color = red;
		if(green>color){
			color = green;
		}
		if(blue>color){
			color = blue;
		}
		
		var x = pattern[i][0];
		var y = pattern[i][1];

		pixels.set(x, y, 0, color);
		pixels.set(x, y, 1, color);
		pixels.set(x, y, 2, color);

		if(i>lastReport+fivePercent){
			console.log((100/imgLength)*i);
			lastReport = i;
		}

	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});


