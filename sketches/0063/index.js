var co = require("co");
var sketchSaver = require("../../lib/sketch-saver");
var listOfImages = require("./source-images.json");
var savePixels = require("save-pixels");
var pattern = require("../../patterns/fork");
var fs = require("fs");
var path = require("path");
var fann = require("fann");
var getPixels = require("get-pixels");
var ndarray = require("ndarray");
var savePixels = require("save-pixels");

var BLOCK_SIZE = parseInt(process.argv[2], 10);

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

var saveAsImg = function(array, name){
	console.log("saving ", name);
	var pixels = ndarray([], [640, 640, 3]);
	
	var s = 0;
	var c = 0;
	var color = Math.floor(array[s] * 256);
	for(var i=0; i<640; i++){
		for(var j=0; j<640; j++){
			pixels.set(i, j, 0, color);
			pixels.set(i, j, 1, color);
			pixels.set(i, j, 2, color);
			c++;
			if(c==BLOCK_SIZE){
				c = 0;
				s++;
				color = Math.floor(array[s] * 256);
			}
		}
	}

	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./"+name+".jpg"));
}

co(function*(){

	var numImgs = listOfImages.length;
	var trainData = [];
	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		var img = yield getBasePixels(imgPath);
		var fork = pattern(640);
		var next = fork.next();
		var data = [];
		var val = 0;
		var count = 0;
		while(next.done === false){
			var x = next.value[0];
			var y = next.value[1];

			var red = img.get(x, y, 0);
			var green = img.get(x, y, 1);
			var blue = img.get(x, y, 2);

			if(red !== undefined || green !== undefined || blue !== undefined){
				var max = Math.max(red, green, blue) / 256;
				val += max;
			}

			count++;

			if(count==BLOCK_SIZE){
				var xx = val/BLOCK_SIZE;
				if(isNaN(xx)){
					console.log(val, BLOCK_SIZE, max, red, green, blue, x, y, next.value);
				}
				data.push(xx);
				count = 0;
				val = 0;
			}


			next = fork.next();
		}
		trainData.push([data, data]);
	}

	console.log("Train!", trainData.length, data.length);
	var net = new fann.standard(data.length, 16, data.length);
	var info = net.train(trainData, {error: 0.005});

	console.log("building random image");

	var base = [];
	for(var i=0; i<data.length; i++){
		base.push(Math.random());
	}

	saveAsImg(base, "base");

	for(var i = 0; i<10; i++){
		base = net.run(base);
		var tag = i < 10 ? "00"+i : i < 100 ? "0"+i : i;
		saveAsImg(base, tag);
	}
	

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
