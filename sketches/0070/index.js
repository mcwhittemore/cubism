var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./source-images.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var groupCrome = require("../../lib/filters/group-crome");
var fann = require("fann");
var pattern = require("../../patterns/fork");

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

var mash = function(a){
	var min = Math.min.apply(null, a);
	var max = Math.max.apply(null, a);

	return Math.floor(max/NUM_COLORS);
}

var getColor = function(id, colors){
	var minId = Math.floor(id);
	var maxId = Math.ceil(id);

	var maxPart = id - minId;
	var minPart = 1 - maxPart;

	var minColor = colors[minId];
	var maxColor = colors[maxId];

	var color = [];
	for(var i=0; i<minColor.length; i++){
		var min = minColor[i] * minPart;
		var max = maxColor[i] * maxPart;

		color[i] = Math.floor(min + max); 
	}

	return color;
}

co(function*(){

	var numImgs = listOfImages.length;
	
	var imgs = [];

	for(var b=1; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		var img = yield getBasePixels(imgPath);
		imgs.push(img);
	}

	var BLOCK_SIZE = 6;
	var NUM_COLORS = 10;

	var results = groupCrome(imgs, NUM_COLORS, BLOCK_SIZE, function(a){
		return mash(a)+"-"
	}, 20, 20);
	console.log("received results");
	imgs = null;

	var trainData = [];

	var SHIFT_COLOR = 1/NUM_COLORS;
	var maxmax = [];
	for(var i=0; i<BLOCK_SIZE; i++){
		maxmax.push(256);
		maxmax.push(256);
		maxmax.push(256);
	}
	var SHIFT_RGB = 1/mash(maxmax);


	for(var i=0; i<NUM_COLORS; i++){
		var members = results.members[i];
		for(var j=0; j<members.length; j++){
			var train = [];

			for(var k = 0; k<BLOCK_SIZE*3; k++){
				var ccc = Math.floor(members[j][k] / 2) * 2;
				train.push(ccc);
			}

			var v = mash(train);

			trainData.push([[v*SHIFT_RGB], [i*SHIFT_COLOR]]);
		}
	}

	console.log(trainData[0][0].length, BLOCK_SIZE);
	console.log(trainData[0][1].length, 1);

	var net = new fann.standard(1, BLOCK_SIZE, BLOCK_SIZE, 1);

	console.log("training_algorithm", net.training_algorithm);
	console.log("learning_rate", net.learning_rate);
	console.log("learning_momentum", net.learning_momentum);

	net.train(trainData, {error: 0.006, epochs_between_reports: 100, epochs: 1000000});

	console.log("loading new img");
	var newImg = yield getBasePixels(path.join(__dirname, "../../instagrams", listOfImages[0]+".jpg"));

	var fork = pattern(640);
	var next = fork.next();
	var current = [];
	var xys = [];
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		xys = xys.concat([[x,y]]);

		var red = newImg.get(x, y, 0);
		var green = newImg.get(x, y, 1);
		var blue = newImg.get(x, y, 2);

		current = current.concat([red, green, blue]);

		if(xys.length == BLOCK_SIZE){
			current.sort();
			var colorId = net.run(current) / SHIFT_COLOR;

			var color = getColor(colorId, results.colors);

			for(var i=0; i<BLOCK_SIZE; i++){
				var j = i*3;
				var x = xys[i][0];
				var y = xys[i][1];
				newImg.set(x, y, 0, color[j+0]);
				newImg.set(x, y, 1, color[j+1]);
				newImg.set(x, y, 2, color[j+2]);
			}

			xys = [];
			current = [];
		}

		var next = fork.next();
	}

	console.log("image built");

	savePixels(newImg, "jpg").pipe(fs.createWriteStream("./imgs/new.jpg"));

	for(var i=0; i<results.imgs.length; i++){
		savePixels(results.imgs[i], "jpg").pipe(fs.createWriteStream("./imgs/"+i+".jpg"));		
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
