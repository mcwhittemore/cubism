var co = require("co");

var ndarray = require("ndarray");
var fs = require("fs");
var savePixels = require("save-pixels");
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

co(function*(){

	var START = 640;
	var END = 3600;
	var GROWTH = END/START;
	var SAMPLE_SIZE = 2;

	var baseImg = yield getBasePixels("../sketch/test.jpg");
	var endImg = ndarray([], [END, END, 3]);

	for(var x=0; x<END; x++){
		var rowId = "row";
		console.time(rowId);
		var distTime = 0;
		for(y=0; y<END; y++){
			
			var mx = Math.floor(x / GROWTH);
			var my = Math.floor(y / GROWTH);

			var sx = Math.max(mx - SAMPLE_SIZE, 0);
			var ex = mx + SAMPLE_SIZE;

			var sy = Math.max(my - SAMPLE_SIZE, 0);
			var ey = my + SAMPLE_SIZE;

			var red = 0;
			var green = 0;
			var blue = 0;
			var count = 0;

			for(var cx=sx; cx<ex; cx++){
				for(var cy=sy; cy<ey; cy++){
					red += baseImg.get(cx,cy,0);
					green += baseImg.get(cx,cy,1);
					blue += baseImg.get(cx,cy,2);
					count++;
				}
			}

			endImg.set(x, y, 0, Math.floor(red / count));
			endImg.set(x, y, 1, Math.floor(green / count));
			endImg.set(x, y, 2, Math.floor(blue / count));
		}
		console.log(x);
		console.timeEnd(rowId);
	}

	savePixels(endImg, "jpg").pipe(fs.createWriteStream("./sample-"+SAMPLE_SIZE+".jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


