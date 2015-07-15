var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./source-images.json");
var others = require("./others.json");
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

var mergeColors = function(id, colors){
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

var score = function(a, b){
	var total = 0;
	for(var i=0; i<a.length; i++){
		var ai = a[i];
		var bi = b[i];
		var part = Math.abs(ai - bi) / 256;
		if(isNaN(part)){
			part = 1;
		}
		total += part;
	}
	var s = total / a.length;

	if(isNaN(s)){
		console.log("SCORE", total, a.length, s);
	};

	return s;
}

var scoreGroup = function(a, group){
	var records = [];
	for(var i=0; i<group.length; i++){
		records.push(score(a, group[i]));
	}
	return records;
}

var getMin = function(a){
	return Math.min.apply(null, a);
}

var getPath = function(imgId){
	return path.join(__dirname, "../../instagrams", imgId+".jpg");
}

co(function*(){

	var BLOCK_SIZE = 6;
	var NUM_COLORS = 2;

	var mash = function(a){
		return Math.floor(Math.max.apply(null, a) / 16) * 16;
	}

	var numImgs = listOfImages.length;
	
	var records = [];

	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath =  getPath(imgId);
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		var img = yield getBasePixels(imgPath);
		var result = groupCrome([img], NUM_COLORS, BLOCK_SIZE, function(a){
			return mash(a)+"-"
		});

		savePixels(result.imgs[0], "jpg").pipe(fs.createWriteStream("./imgs/"+imgId+".jpg"));

		records.push(result.colors);
	}

	var getColor = function(block){
		var scores = [scoreGroup(block, records[0])];
		var min = getMin(scores[0]);
		var minIndex = 0;

		for(var i=1; i<records.length; i++){
			scores.push(scoreGroup(block, records[i]));
			var pm = getMin(scores[i]);
			if(pm < min){
				min = pm;
				minIndex = i;
			}
		}

		var minScore = scores[minIndex];

		var posOfMin = minScore.indexOf(min);

		var nextColor = records[minIndex][posOfMin];

		return nextColor;
	}

	for(var k=0; k<others.length; k++){
		var imgId = others[k];
		console.log("loading new img");
		var newImg = yield getBasePixels(getPath(imgId));

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

				var color = getColor(current);

				for(var i=0; i<BLOCK_SIZE; i++){
					var x = xys[i][0];
					var y = xys[i][1];
					var j = i*3
					newImg.set(x, y, 0, color[j+0]);
					newImg.set(x, y, 1, color[j+1]);
					newImg.set(x, y, 2, color[j+2]);
				}

				current = [];
				xys = [];

			}

			var next = fork.next();
		}

		console.log("image built", imgId);

		savePixels(newImg, "jpg").pipe(fs.createWriteStream("./others/"+imgId+".jpg"));
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
