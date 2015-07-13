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

	var BLOCK_SIZE = 12;
	var NUM_COLORS = 8;

	var results = groupCrome(imgs, 8, BLOCK_SIZE, undefined, 20, 20);
	console.log("received results");
	imgs = null;

	var trainData = [];

	for(var i=0; i<NUM_COLORS; i++){
		var members = results.members[i];
		for(var j=0; j<members.length; j++){
			trainData.push([members[j], [i]]);
		}
	}

	var net = new fann.standard(BLOCK_SIZE, NUM_COLORS, 1);

	console.log("training_algorithm", net.training_algorithm);
	console.log("learning_rate", net.learning_rate);
	console.log("learning_momentum", net.learning_momentum);

	net.train(trainData, {error: 0.005, epochs_between_reports: 10});

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
			var colorId = net.run(current);

			var color = getColor(colorId, results.colors);

			for(var i=0; i<BLOCK_SIZE; i++){
				var j = i*3;
				var x = xys[i][0];
				var y = xys[i][1];
				newImg.set(x, y, 0, current[j+0]);
				newImg.set(x, y, 1, current[j+1]);
				newImg.set(x, y, 2, current[j+2]);
			}

			xys = [];
			current = [];
		}
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
