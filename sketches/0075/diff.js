var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var others = require("./others.json");
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

var getColors = function(img, x, y){
	return {
		red: img.get(x, y, 0),
		green: img.get(x, y, 1),
		blue: img.get(x, y, 2)
	};
}

var getPath = function(imgId){
	return path.join(__dirname, "../../instagrams", imgId+".jpg");
}

co(function*(){

	

	for(var k=0; k<others.length; k++){
		var imgId = others[k];
		console.log("loading new img");
		var left = yield getBasePixels(getPath(imgId));
		var right = yield getBasePixels(getPath("../sketches/0075/others/"+k));

		for(var x = 0; x<640; x++){
			for(var y = 0; y<640; y++){
				var l = getColors(left, x, y);
				var r = getColors(right, x, y);

				var redDif = r.red - l.red;
				var greenDif = r.green - l.green;
				var blueDif = r.blue - l.blue;

				var red = 128 + Math.floor((redDif)/2);
				var green = 128 + Math.floor((greenDif)/2);
				var blue = 128 + Math.floor((blueDif)/2);

				var tDiff = redDif/3 + greenDif/3 + blueDif/3;
				var tRed = 0;
				var tGreen = 0;
				var tBlue = 0;

				if(tDiff<0){
					tRed = Math.floor(Math.abs(tDiff));
				}
				else{
					tGreen = Math.floor(Math.abs(tDiff));
				}

				left.set(x, y, 0, red);
				left.set(x, y, 1, green);
				left.set(x, y, 2, blue);

				right.set(x, y, 0, tRed);
				right.set(x, y, 1, tGreen);
				right.set(x, y, 2, tBlue);


			}
		}

		savePixels(left, "jpg").pipe(fs.createWriteStream("./diff/"+k+"-full.jpg"));
		savePixels(right, "jpg").pipe(fs.createWriteStream("./diff/"+k+"-easy.jpg"));
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
