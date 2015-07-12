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

var BLOCK_SIZE = parseInt(process.argv[2]) * 3;
var ITTERATIONS = parseInt(process.argv[3]);

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
	var SHIFT_WEIGHT = 1/16;
	
	var imgs = [];

	for(var b=1; b<numImgs; b++){
		imgs[b] = [];
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

			var red = Math.floor(img.get(x, y, 0) / 16) * SHIFT_WEIGHT;
			var green = Math.floor(img.get(x, y, 1) / 16) * SHIFT_WEIGHT;
			var blue = Math.floor(img.get(x, y, 2) / 16) * SHIFT_WEIGHT;

			current.push(red);
			current.push(green);
			current.push(blue);

			if(current.length === BLOCK_SIZE){
				imgs[b-1].push(current);
				current = [];
			}

			next = fork.next();
		}
	}

	var basic = [];
	for(var i=0; i<BLOCK_SIZE; i++){
		basic.push(0);
	}

	for(var b = 0; b<imgs[0].length; b++){
		var row = [].concat(basic);
		for(var i = 0; i<imgs.length; i++){
			var imgRow = imgs[i][b];
			for(var j=0; j<imgRow.length; j++){
				row[j] = row[j]+ (imgRow[j] / imgs[0].length);
			}
		}
		
		for(var i=0; i<imgs.length; i++){
			var imgRow = imgs[i][b];
			console.log(imgRow, row);
			trainData.push([imgRow, row]);
		}
	}

	console.log("Train!", trainData.length);

	var net = new fann.standard(BLOCK_SIZE, 16, BLOCK_SIZE);

	// net.training_algorithm = "INCREMENTAL";
	// net.learning_momentum = .2;
	// net.learning_rate = .5;

	console.log("training_algorithm", net.training_algorithm);
	console.log("learning_rate", net.learning_rate);
	console.log("learning_momentum", net.learning_momentum);

	var info = net.train(trainData, {error: 0.005, epochs_between_reports: 10});

	var imgId = listOfImages[0];
	var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
	var img = yield getBasePixels(imgPath);
	
	var pixels = ndarray([], [640, 640, 3]);

	for(var trip=1; trip<ITTERATIONS+1; trip++){

		console.log("start", trip);
		var fork = pattern(640);
		var next = fork.next();
		var p = 0;
		var data = [];
		var get = [];
		var xy = [];
		while(next.done === false){
			var x = next.value[0];
			var y = next.value[1];

			var red = Math.floor(img.get(x, y, 0) / 16) * SHIFT_WEIGHT;
			var green = Math.floor(img.get(x, y, 1) / 16) * SHIFT_WEIGHT;
			var blue = Math.floor(img.get(x, y, 2) / 16) * SHIFT_WEIGHT;

			get.push(red);
			get.push(green);
			get.push(blue);

			xy.push({
				x: x,
				y: y
			});

			if(get.length == BLOCK_SIZE){
				var data = net.run(get);
				for(var i=0; i<xy.length; i++){
					var xx = xy[i].x;
					var yy = xy[i].y;
					
					var j = i*3;

					for(var k=0; k<3; k++){
						var val = Math.floor((data[j+k] / SHIFT_WEIGHT) * 16);
						pixels.set(xx, yy, k, val);
					}

				}

				get = [];
				xy = [];
			}
			
			next = fork.next();
		}

		if(trip%20 === 0 || trip === 1 || trip === ITTERATIONS){
			console.log("saving this one");
			var tripStub = trip - 10 < 0 ? "00"+trip : trip - 100 < 0 ? "0"+trip : trip;
			savePixels(pixels, "jpg").pipe(fs.createWriteStream("./imgs/"+tripStub+".jpg"));
		}
		img = pixels;
	}


}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
