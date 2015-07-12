var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
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

co(function*(){

	var numImgs = listOfImages.length;
	
	var trainData = [];
	var SHIFT_WEIGHT = 1/256;
	var BLOCK_SIZE = 3;

	for(var b=1; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		var img = yield getBasePixels(imgPath);
		var fork = pattern(640);
		var next = fork.next();
		var current = [];
		while(next.done === false){
			var x = next.value[0];
			var y = next.value[1];

			var red = img.get(x, y, 0);
			var green = img.get(x, y, 1);
			var blue = img.get(x, y, 2);

			current.push(Math.max(red, green, blue) * SHIFT_WEIGHT);

			if(current.length === BLOCK_SIZE){
				trainData.push({input:[current[0]], output:current});
				current = [];
			}

			next = fork.next();
		}
	}

	console.log("Train!", trainData.length);

	var net = new brain.NeuralNetwork({
		hiddenLayers: [1, 2, 3]
	});

	var info = net.train(trainData, {
		errorThresh: 0.005,  // error threshold to reach
		iterations: 2000,   // maximum training iterations
		log: true,           // console.log() progress periodically
		logPeriod: 200,       // number of iterations between logging
		learningRate: 0.5    // learning rate
	});

	console.log("TRAINING INFO", info);

	var imgId = listOfImages[0];
	var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
	var img = yield getBasePixels(imgPath);
	
	var pixels = ndarray([], [640, 640, 3]);
	console.log("start");
	var fork = pattern(640);
	var next = fork.next();
	var p = 0;
	var data = [];
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		if (data[p] === undefined){
			var red = img.get(x, y, 0);
			var green = img.get(x, y, 1);
			var blue = img.get(x, y, 2);
			var seed = Math.max(red, green, blue) * SHIFT_WEIGHT;
			data = net.run([seed]);
			p = 0;
		}

		var val = Math.floor(data[p] / SHIFT_WEIGHT);

		pixels.set(x, y, 0, val);
		pixels.set(x, y, 1, val);
		pixels.set(x, y, 2, val);
		
		next = fork.next();
		p++;
	}
	console.log("end", val);

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
