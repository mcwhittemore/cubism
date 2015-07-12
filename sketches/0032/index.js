var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var pattern = require("../../patterns/fork");
var smudge = require("../../lib/blending/smudger");
var box = require("../../lib/selectors/box");
var listOfImages = require("./source-images.json");

var ndarray = require("ndarray");
var savePixels = require("save-pixels");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");

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

var getColors = function(img, x, y, p){
	var SCOPE = 16;

	var out = {
		red: img.get(x, y, 0),
		green: img.get(x, y, 1),
		blue: img.get(x, y, 2)
	};

	var id = out.red / SCOPE + p;

	out.id = ""+id;

	return out;
}

co(function*(){

	var IMG_SIZE = 640;
	var numImgs = listOfImages.length;
	var imgLength = IMG_SIZE * IMG_SIZE;
	var fivePercent = imgLength/20;
	var pixels = ndarray([], [IMG_SIZE, IMG_SIZE, 3]);

	var imgs = [];
	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		console.time("report");
		var img = yield getBasePixels(imgPath);
		imgs.push(img);
	}

	var fork = pattern(IMG_SIZE);
	
	var mind = {};
	var ids = [];

	var loc = null;

	var last = fork.next();
	var item = fork.next();
	var p = 0;
	var lastReport = 0;
	console.log("teaching");
	while(item.done === false){

		for(var i=0; i<numImgs; i++){
			var pixel = getColors(imgs[i], last.value[0], last.value[1], p);
			var next = getColors(imgs[i], item.value[0], item.value[1], p+1);

			pixel.dist = Math.abs(pixel.green - next.green);
			pixel.next = next.id;

			if(loc === null){
				loc = pixel.id;
			}

			if(mind[pixel.id] === undefined){
				mind[pixel.id] =  {
					vals: [],
					pos: 0
				};
				ids.push(pixel.id);
			}

			mind[pixel.id].vals.push(pixel);
		}

		last = item;
		item = fork.next();
		p++;

		if(p>lastReport+fivePercent){
			console.log((100/imgLength)*p);
			lastReport = p;
		}

	}

	for(var i=0; i<numImgs; i++){
		var pixel = getColors(imgs[i], last.value[0], last.value[1], p+1);
		var next = getColors(imgs[i], last.value[0], last.value[1], p+1);

		pixel.dist = Math.abs(pixel.green - next.green);
		pixel.next = next.id;

		if(mind[pixel.id] === undefined){
			mind[pixel.id] =  {
				vals: [],
				pos: 0
			};
			ids.push(pixel.id);
		}

		mind[pixel.id].vals.push(pixel);
	}

	console.log("sorting");
	for(var i=0; i<ids.length; i++){
		var id = ids[i];
		mind[id].vals.sort(function(a, b){
			return b.dist - a.dist;
		});
	}
	
	var fork = pattern(IMG_SIZE);
	var cur = fork.next();
	var p = 0;
	var lastReport = 0;

	var used = {};
	var usedIds = [];
	var reset = 0;

	console.log("filling in pixels");
	while(cur.done === false){
		used[loc] = used[loc] ? used[loc] + 1 : 1;

		if(used[loc]){
			used[loc] = used[loc] + 1;
		}
		else{
			used[loc] = 1;
			usedIds.push(loc);
		}

		var x = cur.value[0];
		var y = cur.value[1];

		try{
			var pixel = mind[loc].vals[mind[loc].pos];
			mind[loc].pos = mind[loc].pos + 1;
			if(mind[loc].pos == mind[loc].vals.length){
				mind[loc].pos = 0;
				reset++;
			}

			pixels.set(x, y, 0, pixel.red);
			pixels.set(x, y, 1, pixel.green);
			pixels.set(x, y, 2, pixel.blue);
		}
		catch(err){
			pixels.set(x, y, 0, 0);
			pixels.set(x, y, 1, 0);
			pixels.set(x, y, 2, 255);
		}

		oldLoc = loc;
		loc = pixel.next;
		cur = fork.next();
		p++;

		if(p>lastReport+fivePercent){
			console.log((100/imgLength)*p);
			lastReport = p;
		}
	}
	console.log("analyzing");
	var perIdsUsed = (100/ids.length)*usedIds.length;
	console.log("perIdsUsed", perIdsUsed);
	var perReset = (100/imgLength)*reset;
	console.log("perReset", perReset);

	console.log("writing");
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./test.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});


