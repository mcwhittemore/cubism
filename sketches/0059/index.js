var co = require("co");
var sketchSaver = require("../../lib/sketch-saver");
var listOfImages = require("./source-images.json");
var savePixels = require("save-pixels");
var pattern = require("../../patterns/fork");
var fs = require("fs");
var path = require("path");
var brain = require("brain");
var getPixels = require("get-pixels");
var ndarray = require("ndarray");
var savePixels = require("save-pixels");



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

var SHIFT_WEIGHT = 1/16777216;
var SHRINK = 32;
var getColorIndex = function(img, pos){
	var x = pos[0];
	var y = pos[1];

	var red = Math.floor(img.get(x, y, 0) / SHRINK) * SHRINK;
	var green = Math.floor(img.get(x, y, 1) / SHRINK) * SHRINK;
	var blue = Math.floor(img.get(x, y, 2) / SHRINK) * SHRINK;

	return (red << 16 | green << 8 | blue) * SHIFT_WEIGHT;
}
var getColors = function(val){
	var colorIndex = Math.floor(val / SHIFT_WEIGHT);

	var red = colorIndex >> 16;
	var green = (colorIndex - (red << 16)) >> 8;
	var blue = colorIndex - (red << 16) - (green << 8);

	return {
		red: red,
		green: green,
		blue: blue
	}
}

// var SHIFT_WEIGHT = 1/256;
// var getColorIndex = function(img, pos){
// 	var x = pos[0];
// 	var y = pos[1];

// 	var red = img.get(x, y, 0);
// 	var green = img.get(x, y, 1);
// 	var blue = img.get(x, y, 2);

// 	return Math.max(red) * SHIFT_WEIGHT;
// }
// var getColors = function(val){
// 	var color = Math.floor(val / SHIFT_WEIGHT);

// 	return {
// 		red: color,
// 		green: color,
// 		blue: color
// 	}
// }

co(function*(){

	var numImgs = listOfImages.length;
	
	var trainData = [];
	
	for(var b=1; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		var img = yield getBasePixels(imgPath);
		var fork = pattern(640);
		var back = getColorIndex(img, fork.next().value);
		var bback = getColorIndex(img, fork.next().value);
		var current = getColorIndex(img, fork.next().value);
		var fforward = getColorIndex(img, fork.next().value);
		var next = fork.next();
		while(next.done === false){
			var forward = getColorIndex(img, next.value);

			trainData.push({
				input: {
					back: back,
					bback: bback,
					fforward: fforward,
					forward: forward
				},
				output: {
					current: current
				}
			});

			back = bback;
			bback = current;
			current = fforward;
			fforward = forward;
			for(var jjj=0; jjj<3; jjj++){
				next = fork.next();
			}
		}
		console.log("next...");
	}

	console.log("Train!", trainData.length);

	var net = new brain.NeuralNetwork({
		hiddenLayers: [2, 2]
	});

	var info = net.train(trainData, {
		errorThresh: 0.005,  // error threshold to reach
		iterations: 20,   // maximum training iterations
		log: true,           // console.log() progress periodically
		logPeriod: 1,       // number of iterations between logging
		learningRate: 0.3    // learning rate
	});

	console.log("TRAINING INFO", info);
	
	var pixels = ndarray([], [640, 640, 3]);

	var fork = pattern(640);
	var next = fork.next();
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var red = Math.floor(Math.random()*256);
		var green = Math.floor(Math.random()*256);
		var blue = Math.floor(Math.random()*256);

		pixels.set(x, y, 0, red);
		pixels.set(x, y, 1, green);
		pixels.set(x, y, 2, blue);
		next = fork.next();
	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./base.jpg"));

	for(var i=0; i<10; i++){

		console.log("start", i);
		var fork = pattern(640);
		var back = getColorIndex(pixels, fork.next().value);
		var bback = getColorIndex(pixels, fork.next().value);
		fork.next();
		var fforward = getColorIndex(pixels, fork.next().value);
		var next = fork.next();
		while(next.done === false){
			var forward = getColorIndex(pixels, next.value);

			var x = next.value[0];
			var y = next.value[1];

			var input = {
				back: back,
				bback: bback,
				fforward: fforward,
				forward: forward
			};
			var output = net.run(input);

			var colors = getColors(output.current);

			pixels.set(x, y, 0, colors.red);
			pixels.set(x, y, 1, colors.green);
			pixels.set(x, y, 2, colors.blue);

			back = bback;
			bback = output.current;
			fforward = forward;
			next = fork.next();
		}
		console.log("end");

		var tag = i < 10 ? "00"+i : i < 100 ? "0"+i : i;
		savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test-"+tag+".jpg"));
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
