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

var getColors = function(img, x, y){
	return {
		red: img.get(x, y, 0),
		green: img.get(x, y, 1),
		blue: img.get(x, y, 2)
	};
}

var findScore = function(a, b){

	var vals = [
		{
			value: a.red,
			name: "red"
		},
		{
			value: a.green,
			name: "green"
		},
		{
			value: a.blue,
			name: "blue"
		}
	];

	vals.sort(function(k, l){
		return l.value - k.value;
	});

	var top = vals[0];
	return Math.abs(a[top.name] - b[top.name]);
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

	var usedColors = {};
	var usedColorIds = [];

	console.log("drafiting");
	var draft = ndarray([], [IMG_SIZE, IMG_SIZE, 3]);
	var fork = pattern(IMG_SIZE);
	var next = fork.next();
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var maxTotal = 0;

		var redTotal = 0;
		var greenTotal = 0;
		var blueTotal = 0;

		for(var i=0; i<numImgs; i++){
			var colors = getColors(imgs[i], x, y);
			
			maxTotal = (maxTotal + colors.red + colors.green + colors.blue) / 2;

			redTotal = redTotal + colors.red;
			greenTotal = greenTotal + colors.green;
			blueTotal = blueTotal + colors.blue;
		}

		var maxAvg = Math.floor(maxTotal);

		var redAvg = Math.floor(redTotal / numImgs);
		var greenAvg = Math.floor(greenTotal / numImgs);
		var blueAvg = Math.floor(blueTotal / numImgs);

		if(usedColors[""+maxAvg] === undefined){
			usedColors[""+maxAvg] = [];
			usedColorIds.push(maxAvg);
		}

		usedColors[""+maxAvg].push({
			red: redAvg,
			green: greenAvg,
			blue: blueAvg
		});

		pixels.set(x, y, 0, maxAvg);
		pixels.set(x, y, 1, maxAvg);
		pixels.set(x, y, 2, maxAvg);

		draft.set(x, y, 0, Math.floor(maxAvg/3));
		draft.set(x, y, 1, Math.floor(maxAvg/3));
		draft.set(x, y, 2, Math.floor(maxAvg/3));

		next = fork.next();
	}
	savePixels(draft, "jpg").pipe(fs.createWriteStream("./draft.jpg"));

	console.log("spectrum");
	var usedColorSet = {};
	var spectrum = ndarray([], [IMG_SIZE, IMG_SIZE, 3]);
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

			if(y < 640){
				spectrum.set(x, y, 0, uc.red);
				spectrum.set(x, y, 1, uc.green);
				spectrum.set(x, y, 2, uc.blue);
			}
		}

		usedColorSet[""+x] = {
			red: Math.floor(redTotal),
			green: Math.floor(greenTotal),
			blue: Math.floor(blueTotal),
		}
	}

	savePixels(spectrum, "jpg").pipe(fs.createWriteStream("./spectrum.jpg"));

	

	console.log("contrasting");
	var fork = pattern(IMG_SIZE);
	var next = fork.next();
	var graft = ndarray([], [IMG_SIZE, IMG_SIZE, 3]);
	while(next.done === false){
		var x = next.value[0];
		var y = next.value[1];

		var pixel = getColors(pixels, x, y);

		var color = pixel.red;
		var set = usedColorSet[""+color];

		if(set.red < 0 || set.red > 255){ console.log("bad red"); }
		if(set.green < 0 || set.green > 255){ console.log("bad green"); }
		if(set.blue < 0 || set.blue > 255){ console.log("bad blue"); }

		graft.set(x, y, 0, set.red);
		graft.set(x, y, 1, set.green);
		graft.set(x, y, 2, set.blue);

		next = fork.next();
	}

	savePixels(graft, "jpg").pipe(fs.createWriteStream("./result.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


