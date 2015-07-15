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

var diff = function(img, x1, y1, x2, y2){
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

var getRoute = function(img, x, y, route){
	var diffs = [];
	for(var i=0; i<changes.length; i++){
		var c = changes[i];
		var x2 = x + c[0];
		var y2 = y + c[1];
		if(x2>-1 && x2 < 640 && y2 > -1 && y2 < 640){
			var key = x2+"-"+y2;
			var d = diff(img, x, y, x2, y2);
			diffs.push({
				x: x2,
				y: y2,
				val: d,
				key: key
			});
		}
	}

	diffs.sort(function(a, b){
		return b.val - a.val;
	});

	var from = route.length;

	for(var i=0; i<diffs.length; i++){
		console.log(from, diffs[i].val);
		if(route.indexOf(diffs[i].key) == -1){
			route.push(diffs[i].key);
			route = getRoute(img, diffs[i].x, diffs[i].y, route);
		}
	}

	return route;
}

co(function*(){

	var routes = [];

	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var img = yield getBasePixels(getPath(imgId));
		var route = getRoute(img, 320, 320, []);
		routes.push(route);
	}

	console.log(routes);

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});