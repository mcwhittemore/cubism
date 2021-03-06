var path = require('path');
var co = require("co");
var ndarray = require('ndarray');
var ngraph = require('ngraph.graph');
var Modularity = require('ngraph.modularity');
var forcelayout = require('ngraph.forcelayout.v2');

var colorTools = require('../../lib/color-tools');
var getBasePixels = require('../../lib/get-base-pixels');
var getPath = require('../../lib/get-image-path');
var saveImage = require('../../lib/save-image');
var sketchSaver = require("../../lib/sketch-saver");

var listOfImages = require("./image-ids.json");

co(function*(){

	var setOfColors = [];

	var theGraph = ngraph();

	var BLOCK_SIZE = 5;

	console.log('adding images to graph');
	var count = 0;
	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		var rawImg = yield getBasePixels(imgPath);

		for (var x = 0; x<640; x+=BLOCK_SIZE) {
			for (var y = 0; y<640; y+=BLOCK_SIZE) {
				var red = rawImg.get(x, y, 0);
				var green = rawImg.get(x, y, 1);
				var blue = rawImg.get(x, y, 2);
				var color = colorTools.encode(red, green, blue);

				var id = setOfColors.length
				setOfColors.push(color);
				theGraph.addNode(id);
			}
		}
	}

	console.log('sorting');
	setOfColors.sort();

	console.log('connecting nodes', setOfColors.length);
	var connections = [1, 2];
	var size = 30;
	for (var i=1; i<size-1; i+=2) {
		connections.push(connections[i] + 1);
	}
	for (var i=0; i < setOfColors.length - connections[0]; i++) {
		var color = setOfColors[i];
		for (var j=0; j<connections.length; j++) {
			var nextId = i+connections[j];
			var next = setOfColors[nextId];
			if (next) {
				var score = colorTools.compare(color, next);
				theGraph.addLink(i, nextId, score);
			}
			else {
				break;
			}
		}
	}

	console.log('doing some clustering');
	var modularity = new Modularity();
	var communities = modularity.execute(theGraph);

	console.log('doing some physics');
	var layout = forcelayout(theGraph);
	// for (var frame = 0; frame < 5; frame++) {
	// 	console.log('frame', frame, 'of', 5);
	// 	layout.step();
	// }


	console.log('projecting nodes into image size');
	var position = layout.getNodePosition(0);

	var minX = position.x;
	var maxX = position.x;

	var minY = position.y;
	var maxY = position.y;

	for(var i=1; i<setOfColors.length; i++) {
		position = layout.getNodePosition(i);
		if (position.x < minX) {
			minX = position.x;
		}

		if (position.x > maxX) {
			maxX = position.x;
		}

		if (position.y < minY) {
			minY = position.y;
		}

		if (position.y > maxY) {
			maxY = position.y;
		}
	}

	var IMAGE_SIZE = 211;

	var scale = IMAGE_SIZE / Math.max((maxX - minX), (maxY - minY));

	var holdPixels = ndarray([], [IMAGE_SIZE, IMAGE_SIZE, 4]);

	for (var i = 0; i < setOfColors.length; i++) {
		var position = layout.getNodePosition(i);
		var x = Math.floor((position.x - minX) * scale);
		var y = Math.floor((position.y - minY) * scale);
		var color = colorTools.decode(setOfColors[i]);
		color.push(1);

		for(var c = 0; c<4; c++) {
			holdPixels.set(x, y, c, (holdPixels.get(x, y, c) || 0) + color[c]);
		}
	}

	console.log('merging colors and saving')
	var pixels = ndarray([], [IMAGE_SIZE, IMAGE_SIZE, 3]);
	for (var x = 0; x<IMAGE_SIZE; x++) {
		for (var y = 0; y<IMAGE_SIZE; y++) {
			var num = (holdPixels.get(x, y, 3) || 1)

			for (var c = 0; c < 3; c++) {
				var val = (holdPixels.get(x, y, c) || 0)
				if (val / num > 0) {
					pixels.set(x, y, c, Math.floor(val / num));
				}
				else {
					pixels.set(x, y, c, 122);
				}

			}
		}
	}

	yield saveImage(pixels, path.join(__dirname, 'data', 'fun.jpg'));


}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});
