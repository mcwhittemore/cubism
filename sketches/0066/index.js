var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./source-images.json");
var savePixels = require("save-pixels");
var pattern = require("../../patterns/fork");
var fs = require("fs");
var path = require("path");
var fann = require("fann");
var getPixels = require("get-pixels");
var ndarray = require("ndarray");
var savePixels = require("save-pixels");

var BLOCK_SIZE = parseInt(process.argv[2]);
var KEEP_FROM = parseInt(process.argv[3]);
var ITTERATIONS = parseInt(process.argv[4]);

var KEEP_FROM_IT = (BLOCK_SIZE - KEEP_FROM) / ITTERATIONS;

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

	// var numImgs = listOfImages.length;
	
	// var trainData = [];
	// var SHIFT_WEIGHT = 1/16777216;
	// console.log("BLOCK_SIZE:", BLOCK_SIZE);

	// for(var b=1; b<numImgs; b++){
	// 	var imgId = listOfImages[b];
	// 	var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
	// 	console.log("parse "+imgPath+" "+b+" of "+numImgs);
	// 	var img = yield getBasePixels(imgPath);
	// 	var fork = pattern(640);
	// 	var next = fork.next();
	// 	var current = [];
	// 	while(next.done === false){
	// 		var x = next.value[0];
	// 		var y = next.value[1];

	// 		var red = img.get(x, y, 0);
	// 		var green = img.get(x, y, 1);
	// 		var blue = img.get(x, y, 2);

	// 		current.push((red << 16 | green << 8 | blue) * SHIFT_WEIGHT);

	// 		if(current.length === BLOCK_SIZE){
	// 			trainData.push([current, current]);
	// 			current = [];
	// 		}

	// 		next = fork.next();
	// 	}
	// }

	// console.log("Train!", trainData.length);

	// var net = new fann.standard(BLOCK_SIZE, 8, BLOCK_SIZE)

	// var info = net.train(trainData, {error: 0.005});

	// var imgId = listOfImages[0];
	// var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
	// var img = yield getBasePixels(imgPath);
	
	// var pixels = ndarray([], [640, 640, 3]);
	// var stub = BLOCK_SIZE - 10 < 0 ? "00"+BLOCK_SIZE : BLOCK_SIZE - 100 < 0 ? "0"+BLOCK_SIZE : BLOCK_SIZE;

	// for(var trip=1; trip<ITTERATIONS+1; trip++){

	// 	var keep = KEEP_FROM - Math.floor(KEEP_FROM_IT * trip);
	// 	console.log("start", trip, keep);
	// 	var fork = pattern(640);
	// 	var next = fork.next();
	// 	var p = 0;
	// 	var data = [];
	// 	var get = [];
	// 	var xy = [];
	// 	while(next.done === false){
	// 		var x = next.value[0];
	// 		var y = next.value[1];

	// 		var red = img.get(x, y, 0);
	// 		var green = img.get(x, y, 1);
	// 		var blue = img.get(x, y, 2);

	// 		var seed = (red << 16 | green << 8 | blue) * SHIFT_WEIGHT;
	// 		get.push(seed);

	// 		xy.push({
	// 			x: x,
	// 			y: y
	// 		});

	// 		if(get.length == BLOCK_SIZE){
	// 			var data = net.run(get);
	// 			for(var i=0; i<data.length; i++){
	// 				var xx = xy[i].x;
	// 				var yy = xy[i].y;
	// 				var val = Math.floor(data[i] / SHIFT_WEIGHT);

	// 				var red = val >> 16;
	// 				var green = (val - (red << 16)) >> 8;
	// 				var blue = val - (red << 16) - (green << 8);

	// 				pixels.set(xx, yy, 0, red);
	// 				pixels.set(xx, yy, 1, green);
	// 				pixels.set(xx, yy, 2, blue);
	// 			}

	// 			get = get.splice(keep);
	// 			xy = xy.splice(keep);
	// 		}
			
	// 		next = fork.next();
	// 	}

	// 	if(trip%20 === 0 || trip === 1 || trip === ITTERATIONS){
	// 		console.log("saving this one");
	// 		var tripStub = trip - 10 < 0 ? "00"+trip : trip - 100 < 0 ? "0"+trip : trip;
	// 		savePixels(pixels, "jpg").pipe(fs.createWriteStream("./"+tripStub+".jpg"));
	// 	}
	// 	img = pixels;
	// }


}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
