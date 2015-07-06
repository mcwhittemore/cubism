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
	var BLOCK_SIZE = parseInt(process.argv[2]);
	console.log("BLOCK_SIZE:", BLOCK_SIZE);

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

			current.push(red * SHIFT_WEIGHT);
			current.push(green * SHIFT_WEIGHT);
			current.push(blue * SHIFT_WEIGHT);

			if(current.length === BLOCK_SIZE * 3){
				trainData.push({input:current, output:current});
				current = [];
			}

			next = fork.next();
		}
	}

	console.log("Train!", trainData.length);

	var net = new brain.NeuralNetwork({
		hiddenLayers: [3, 2, 1]
	});

	var info = net.train(trainData, {
		errorThresh: 0.005,  // error threshold to reach
		iterations: 2000,   // maximum training iterations
		log: true,           // console.log() progress periodically
		logPeriod: 20,       // number of iterations between logging
		learningRate: 0.1    // learning rate
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
	var get = [];
	var xy = [];
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var red = img.get(x, y, 0);
		var green = img.get(x, y, 1);
		var blue = img.get(x, y, 2);

		get.push(red * SHIFT_WEIGHT);
		get.push(green * SHIFT_WEIGHT);
		get.push(blue * SHIFT_WEIGHT);

		xy.push({
			x: x,
			y: y
		});

		if(get.length == BLOCK_SIZE * 3){
			var data = net.run(get);
			for(var i=0; i<BLOCK_SIZE; i++){
				var xx = xy[i].x;
				var yy = xy[i].y;
				
				var start = i*3;
				pixels.set(xx, yy, 0, Math.floor(data[start] / SHIFT_WEIGHT));
				pixels.set(xx, yy, 1, Math.floor(data[start+1] / SHIFT_WEIGHT));
				pixels.set(xx, yy, 2, Math.floor(data[start+2] / SHIFT_WEIGHT));
				
			}

			get = [];
			xy = [];
		}
		
		next = fork.next();
	}
	console.log("end");

	var stub = BLOCK_SIZE - 10 < 0 ? "00"+BLOCK_SIZE : BLOCK_SIZE - 100 < 0 ? "0"+BLOCK_SIZE : BLOCK_SIZE;

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./"+stub+".jpg"));

}).catch(function(err){
	console.log(err);
});