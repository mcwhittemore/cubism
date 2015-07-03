var getPixels = require("get-pixels");
var ndarray = require("ndarray");
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

var getColors = function(img, x, y){
	return {
		red: img.get(x, y, 0),
		green: img.get(x, y, 1),
		blue: img.get(x, y, 2)
	};
}

module.exports = function*(imgPath, numColors){
	numColors = numColors || 256;
	var transform = numColors / (16777216);
	var img = yield getBasePixels(imgPath);
	
	var IMG_SIZE = 640;
	var pixels = ndarray([], [IMG_SIZE, IMG_SIZE, 3]);

	var usedColors = {};
	var usedColorIds = [];

	var fork = pattern(IMG_SIZE);
	var next = fork.next();
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var colors = getColors(img, x, y);

		var red = (colors.red / 5) * 3 + (colors.green / 5) + (colors.blue / 5);
		var green = (colors.red / 5) + (colors.green / 5) * 3 + (colors.blue / 5);
		var blue = (colors.red / 5) + (colors.green / 5) + (colors.blue / 5) * 3;
			
		var maxAvg = Math.floor((red << 16 | green << 8 | blue) * transform);

		if(usedColors[""+maxAvg] === undefined){
			usedColors[""+maxAvg] = [];
			usedColorIds.push(maxAvg);
		}

		usedColors[""+maxAvg].push({
			red: colors.red,
			green: colors.green,
			blue: colors.blue
		});

		pixels.set(x, y, 0, maxAvg);
		pixels.set(x, y, 1, maxAvg);
		pixels.set(x, y, 2, maxAvg);

		next = fork.next();
	}

	var usedColorSet = {};
	for(var i=0; i<usedColorIds.length; i++){
		var x = usedColorIds[i];
		var usedColor = usedColors[""+x];

		var redTotal = usedColor[0].red;
		var greenTotal = usedColor[0].green;
		var blueTotal = usedColor[0].blue;

		for(var y = 1; y<usedColor.length && y<640; y++){
			var uc = usedColor[y];

			redTotal = (redTotal + uc.red)/2;
			greenTotal = (greenTotal + uc.green)/2;
			blueTotal = (blueTotal + uc.blue)/2;
		}

		usedColorSet[""+x] = {
			red: Math.floor(redTotal),
			green: Math.floor(greenTotal),
			blue: Math.floor(blueTotal),
		}
	}

	var fork = pattern(IMG_SIZE);
	var next = fork.next();
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var pixel = getColors(pixels, x, y);

		var color = pixel.red;
		var set = usedColorSet[""+color];

		pixels.set(x, y, 0, set.red);
		pixels.set(x, y, 1, set.green);
		pixels.set(x, y, 2, set.blue);

		next = fork.next();
	}

	return pixels;

}