var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json").splice(0, 100);
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var colors = require('./colors');
var ngraph = require('ngraph.graph');
var Modularity = require('ngraph.modularity');

var BLOCK_SIZE = 64;

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

var saveImage = function(pixels, imgId){
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./data/"+imgId+".jpg"));
	return new Promise(function(resolve){
		setTimeout(resolve, 200);
	});
}

var compareCommunities = function(outer, inner){
	var total = 0;
	var setObj = outer.imgIds.concat(inner.imgIds).filter(function(v, id){
		if(v[id]){
			v[id] = 2;
		}
		else{
			total++;
			v[id] = 1;
		}

		return v;
	});

	var numUnique = outer.imgIds.concat(inner.imgIds).reduce(function(v, id){
		if(setObj[id] === 1){
			v++;
		}
		return v;
	}, 0);

	return (1/total)*(total-numUnique);
}

co(function*(){

	var imgsById = {};

	var numBlocksPerDimention = Math.floor(640/BLOCK_SIZE);
	var numBlockTotal = Math.pow(numBlocksPerDimention, 2);

	var blocksByImgAndLoc = ndarray([], [listOfImages.length, numBlocksPerDimention, numBlocksPerDimention]);

	console.log('loading images');
	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		var rawImg = yield getBasePixels(imgPath);

		imgsById[imgId] = rawImg;

		for(var xBase = 0; xBase < numBlocksPerDimention; xBase++){
			for(var yBase = 0; yBase < numBlocksPerDimention; yBase++){
				var redAll = 0;
				var greenAll = 0;
				var blueAll = 0;

				for(var xAdd = 0; xAdd < BLOCK_SIZE; xAdd++){
					for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
						redAll += rawImg.get((xBase*BLOCK_SIZE)+xAdd, (yBase*BLOCK_SIZE)+yAdd, 0);
						greenAll += rawImg.get((xBase*BLOCK_SIZE)+xAdd, (yBase*BLOCK_SIZE)+yAdd, 1);
						blueAll += rawImg.get((xBase*BLOCK_SIZE)+xAdd, (yBase*BLOCK_SIZE)+yAdd, 2);
					}
				}

				blocksByImgAndLoc.set(i, xBase, yBase, {
					imgId: imgId,
					color: colors.encode(
						Math.floor(redAll/ numBlockTotal),
						Math.floor(greenAll/ numBlockTotal),
						Math.floor(blueAll/ numBlockTotal)
					)
				});
			}
		}

		if(i % 30 === 0){
			console.log('\t', (100/listOfImages.length)*i);
		}

		rawImg = null;
	}

	console.log('finding communitiies');
	var allCommunities = [];
	var allCommunitiesGraph = ngraph();
	for(var xBase = 0; xBase < numBlocksPerDimention; xBase++){
		for(var yBase = 0; yBase < numBlocksPerDimention; yBase++){

			var graph = ngraph();

			for(var i=0; i<listOfImages.length; i++){

				var outer = blocksByImgAndLoc.get(i, xBase, yBase);

				var values = new Array(listOfImages.length);
				var valuesByImg = {};

				for(var j=0; j<listOfImages.length; j++){
					var inner = blocksByImgAndLoc.get(j, xBase, yBase);
					if(j===i){
						values.push(0);
						valuesByImg[inner.imgId] = 0;
					}
					else {
						var value = colors.compare(outer.color, inner.color);
						var outOfOne = (1/755)*value;
						values.push(outOfOne);
						valuesByImg[inner.imgId] = outOfOne
					}
				}

				values.sort(function(a, b){ return a - b; });
				var minInGraph = values[(listOfImages.length*.9)-1];

				for(var j=0; j<listOfImages.length; j++){
					var imgId = listOfImages[j];
					if(valuesByImg[imgId] > minInGraph){
						graph.addLink(outer.imgId, imgId, valuesByImg[imgId]);
					}
				}
			}

			var modularity = new Modularity();
			var communities = modularity.execute(graph);

			var imgsByComm = {};

			for(var i=0; i<listOfImages.length; i++){
				var imgId = listOfImages[i];
				var comm = communities[imgId] + '';
				imgsByComm[comm] = imgsByComm[comm] || [];
				imgsByComm[comm].push(imgId);
			}

			var commKeys = Object.keys(imgsByComm);

			for(var i=0; i<commKeys.length; i++){
				var key = commKeys[i];

				var allCommId = xBase+'-'+yBase+'-'+i;

				allCommunitiesGraph.addNode(allCommId);

				allCommunities.push({
					id: allCommId,
					imgIds: imgsByComm[key]
				});
			}
		}
	}

	console.log('merging communities', allCommunities.length);
	var allCommLowPoint = Math.floor(allCommunities.length * .9);
	for(var i=0; i<allCommunities.length; i++){

		var outer = allCommunities[i];

		var scoresByAllCommId = {};
		var values = [];

		for(var j=0; j<allCommunities.length; j++){
			var inner = allCommunities[j];

			var score = inner.id === outer.id ? 0 : compareCommunities(outer, inner);

			scoresByAllCommId[inner.id] = score;
			values.push(score);
		}

		values.sort(function(a, b){ return a-b; });

		var minVal = values[allCommLowPoint];

		for(var j=0; j<allCommunities.length; j++){
			var inner = allCommunities[j];
			var score = scoresByAllCommId[inner.id];

			if(score>=minVal){
				allCommunitiesGraph.addLink(outer.id, inner.id, score);
			}
		}

		if(i % 30 === 0){
			console.log('\t', (100/allCommunities.length)*i);
		}
	}

	var modularity = new Modularity();
	var allCommunitiesGrouped = modularity.execute(allCommunitiesGraph);

	console.log(allCommunitiesGrouped);


	//yield saveImage(pixels, imgId);


}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});