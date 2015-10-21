var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json").splice(0, 200);
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var colors = require('./colors');
var ngraph = require('ngraph.graph');
var Modularity = require('ngraph.modularity');
var pixelBuilder = require('./pixel-blocker');

var BLOCK_SIZE = 128;

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
	var numUnique = 0;
	var setObj = outer.imgIds.concat(inner.imgIds).reduce(function(v, id){
		if(v[id] === 1){
			v[id] = 2;
			numUnique--;
		}
		else if(v[id] === undefined){
			total++;
			numUnique++;
			v[id] = 1;
		}

		return v;
	}, {});

	return (1/total)*(total-numUnique);
}

co(function*(){

	var imgsById = {};

	var numBlocksPerDimention = Math.floor(640/BLOCK_SIZE);
	var numBlockTotal = Math.pow(numBlocksPerDimention, 2);

	var blocksByImgAndLoc = ndarray([], [listOfImages.length, numBlocksPerDimention, numBlocksPerDimention]);

	console.log('loading images', listOfImages.length);
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
		console.time('\t - xBaseSection');
		console.log('\t set', xBase, 100/numBlocksPerDimention*xBase);
		for(var yBase = 0; yBase < numBlocksPerDimention; yBase++){

			var graph = ngraph();

			for(var i=0; i<listOfImages.length; i++){
				var imgId = listOfImages[i];
				graph.addNode(imgId);
			}

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

				var allCommId = allCommunities.length + '';

				if(imgsByComm[key].length > 2){
					allCommunitiesGraph.addNode(allCommId);

					allCommunities.push({
						id: allCommId,
						xBase: xBase,
						yBase: yBase,
						imgIds: imgsByComm[key]
					});
				}

			}
		}
		console.timeEnd('\t - xBaseSection');
	}

	console.log('merging communities', allCommunities.length);
	var allCommLowPoint = Math.floor(allCommunities.length * .9);
	var startTime = process.hrtime();
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
			var diff = process.hrtime(startTime);
			var secondsPer = ((diff[0] * 1e9 + diff[1]) / 1000000000) / (i + 1);
			var timeLeft = secondsPer * (allCommunities.length - (i + 1));
			var showTime = 0;
			var showUnit = 0;

			if(timeLeft > 3600){
				showTime = (timeLeft / 3600).toFixed(4);
				showUnit = 'hours';
			}
			else if(timeLeft > 60){
				showTime = (timeLeft / 60).toFixed(4);
				showUnit = 'minutes';
			}
			else{
				showTime = timeLeft.toFixed(4);
				showUnit = 'seconds';
			}

			console.log('\t', ((100/allCommunities.length)*i).toFixed(4)+'%', '----', showTime, showUnit);
		}
	}

	console.log('doing some stats');
	var modularity = new Modularity();
	var allCommunitiesGrouped = modularity.execute(allCommunitiesGraph);

	var finalImageGroups = {};

	var allCommunityIds = Object.keys(allCommunitiesGrouped);

	for(var i=0; i<allCommunityIds.length; i++){
		var id = allCommunityIds[i];
		var commId = allCommunitiesGrouped[id] + '';
		finalImageGroups[commId] = finalImageGroups[commId] || [];
		finalImageGroups[commId].push(id);
	}

	var finalImageGroupIds = Object.keys(finalImageGroups);

	var greenBlock = ndarray([], [BLOCK_SIZE, BLOCK_SIZE, 3]);

	for(var i=0; i<finalImageGroupIds.length; i++){
		var id = finalImageGroupIds[i];
		console.log('building image', id);
		var allCommunityIds = finalImageGroups[id];

		var communitiesByBlock = ndarray([], [numBlocksPerDimention, numBlocksPerDimention]);

		for(var j=0; j<allCommunityIds.length; j++){
			var allCommId = parseInt(allCommunityIds[j]);
			var comm = allCommunities[allCommId];
			var imgIds = communitiesByBlock.get(comm.xBase, comm.yBase) || [];
			imgIds = imgIds.concat(comm.imgIds);
			communitiesByBlock.set(comm.xBase, comm.yBase, imgIds)
		}

		var pixels = ndarray([], [640, 640, 3]);

		for(var xBase=0; xBase < numBlocksPerDimention; xBase++){
			for(var yBase = 0; yBase < numBlocksPerDimention; yBase++){
				var community = communitiesByBlock.get(xBase, yBase) || [];

				var pixelBlock = ndarray([], [BLOCK_SIZE, BLOCK_SIZE, 3]);

				if(community.length > 0){
					pixelBlock = pixelBuilder(imgsById, community, xBase, yBase, BLOCK_SIZE, 8);
					// for(var j=0; j<community.length; j++){
					// 	var imgId = community[j];
					// 	var img = imgsById[imgId];

					// 	for(var xAdd = 0; xAdd < BLOCK_SIZE; xAdd++){
					// 		var x = (xBase * BLOCK_SIZE) + xAdd;
					// 		for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
					// 			var y = (yBase * BLOCK_SIZE) + yAdd;

					// 			for(var c=0; c<3; c++){
					// 				var current = pixelBlock.get(xAdd, yAdd, c) || 0;
					// 				var imgColor = img.get(x, y, c) * (1/community.length);
					// 				var after = current + imgColor;
					// 				pixelBlock.set(xAdd, yAdd, c, after);
					// 			}
					// 		}
					// 	}
					// }
				}
				else {
					pixelBlock = greenBlock;
				}

				for(var xAdd = 0; xAdd < BLOCK_SIZE; xAdd++){
					var x = (xBase * BLOCK_SIZE) + xAdd;
					for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
						var y = (yBase * BLOCK_SIZE) + yAdd;
						for(var c=0; c<3; c++){
							pixels.set(x, y, c, pixelBlock.get(xAdd, yAdd, c));
						}
					}
				}
			}
		}

		yield saveImage(pixels, id);
	}


}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});