var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./source-images.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var groupCrome = require("../../lib/filters/group-crome");
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

var differ = function(img, x1, y1, x2, y2){
	var red = Math.abs(img.get(x1, y1, 0) - img.get(x2, y2, 0));
	var green = Math.abs(img.get(x1, y1, 1) - img.get(x2, y2, 1));
	var blue = Math.abs(img.get(x1, y1, 2) - img.get(x2, y2, 2));
	return red + green + blue;
}

var changes = [
	[-1, -1],
	[0, -1],
	[1, -1],
	[-1, 0],
	[1, 0],
	[-1, 1],
	[0, 1],
	[1, 1]
]

var max = 640 * 640;
var unit = Math.floor(max / 10);

var getRoute = function(img, x, y){
	var allDiffs = [];
	var route = [];
	var found = {};
	var foundCount = 0;
	var last = 0;
	var count = 0;

	do {
		var diffs = [];
		for(var i=0; i<changes.length && foundCount < max; i++){
			var c = changes[i];
			var x2 = x + c[0];
			var y2 = y + c[1];
			var key = x2+"-"+y2;
			if(x2>-1 && x2 < 640 && y2 > -1 && y2 < 640 && found[key] === undefined){
				found[key] = 1;
				foundCount++;
				var d = differ(img, x, y, x2, y2);
				diffs.push({
					x: x2,
					y: y2,
					val: d,
					key: key
				});
			}
		}

		if(diffs.length > 0){
			diffs.sort(function(a, b){
				return b.val - a.val;
			});

			for(var i=0; i<diffs.length; i++){
				allDiffs.push(diffs[i]);
			}
		}

		var ddd = allDiffs.pop();
		x = ddd.x;
		y = ddd.y;
		route.push(x);
		route.push(y);

		count++;

		if(count >= last+unit){
			console.log( (1/max) * count, "%");
			last = count;
		}

	} while (allDiffs.length > 0);

	return route;
}

co(function*(){

	var BLOCK_SIZE = 12;
	var NUM_COLORS = 48;

	var routes = [];
	var imgs = [];

	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		console.log("loading", imgPath, "...");
		var img = yield getBasePixels(imgPath);
		var route = getRoute(img, 320, 320);
		routes.push(route);
		imgs.push(img);
	}

	var len = routes[0].length;
	for(var i=1; i<routes.length; i++){
		if(len != routes[i].length){
			console.log(listOfImages[i], routes[i].length, len);
			throw new Error("Route Lens");
		}
	}

	var lastColor = [0, 256, 0];
	var routeTeam = null;
	var routeCount = null

	for(var i=0; i<routes[0].length; i+=2){
		if(routeCount == null || routeCount == 0){
			var min = 10000;
			var v = null;
			var nc = null;

			for(var j=0; j<routes.length; j++){
				var x = routes[j][i]
				var y = routes[j][i+1];

				var red = imgs[j].get(x, y, 0);
				var green = imgs[j].get(x, y, 1);
				var blue = imgs[j].get(x, y, 2);

				var ccc = [red, green, blue];

				var mmm = score(lastColor, ccc);

				if(mmm < min || v === null){
					min = mmm;
					v = j;
					nc = ccc;
				}

			}

			routeTeam = v;
			lastColor = nc;
			routeCount = BLOCK_SIZE;
		}

		routeCount--;

		imgs[0].set(routes[0][i], routes[0][i+1], 0, imgs[routeTeam].get(x, y, 0));
		imgs[0].set(routes[0][i], routes[0][i+1], 1, imgs[routeTeam].get(x, y, 1));
		imgs[0].set(routes[0][i], routes[0][i+1], 2, imgs[routeTeam].get(x, y, 2));
	}

	savePixels(imgs[0], "jpg").pipe(fs.createWriteStream("./start.jpg"));

	var mash = function(a){
		return Math.max.apply(null, a);
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
		}, 20, 20);

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

	console.log("loading new img");
	var newImg = imgs[0];

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

	savePixels(newImg, "jpg").pipe(fs.createWriteStream("./end.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});