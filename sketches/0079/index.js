var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./source-images.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
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

	for(var i=0; i<routes[0].length; i+=2){
		var red = 0;
		var green = 0;
		var blue = 0;
		for(var j=0; j<routes.length; j++){
			var x = routes[j][i]
			var y = routes[j][i+1];

			red += imgs[j].get(x, y, 0);
			green += imgs[j].get(x, y, 1);
			blue += imgs[j].get(x, y, 2);
		}

		red = Math.floor(red / routes.length);
		green = Math.floor(green / routes.length);
		blue = Math.floor(blue / routes.length);

		imgs[0].set(routes[0][i], routes[0][i+1], 0, red);
		imgs[0].set(routes[0][i], routes[0][i+1], 1, green);
		imgs[0].set(routes[0][i], routes[0][i+1], 2, blue);
	}

	savePixels(imgs[0], "jpg").pipe(fs.createWriteStream("./start.jpg"));

	var img = imgs[0];
	var route = getRoute(img, 320, 320);

	var lastColor = {
		red: img.get(route[0], route[1], 0),
		green: img.get(route[0], route[1], 1),
		blue: img.get(route[0], route[1], 2)
	}

	for(var i=2; i<route.length; i+=2){

		var x = route[i];
		var y = route[i+1];

		var color = {
			red: img.get(x, y, 0),
			green: img.get(x, y, 1),
			blue: img.get(x, y, 2)
		}

		var difs = [
			{
				color: "red",
				val : lastColor.red - color.red
			},
			{
				color: "green",
				val : lastColor.green - color.green
			},
			{
				color: "blue",
				val : lastColor.blue - color.blue
			}
		]

		difs.sort(function(a, b){
			return a.val - b.val;
		});

		if(difs[0].val < 16){
			color[difs[1].color] = lastColor[difs[1].color];
			color[difs[2].color] = lastColor[difs[2].color];
		}

		img.set(x, y, 0, color.red);
		img.set(x, y, 1, color.green);
		img.set(x, y, 2, color.blue);
	}

	savePixels(imgs[0], "jpg").pipe(fs.createWriteStream("./end.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});