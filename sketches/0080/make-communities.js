var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var ngraph = require('ngraph.graph');
var Modularity = require('ngraph.modularity');

var NUM_IMAGES = 'ALL';
var STRIPE_SIZE = 5;
var STARTER_ID = '7LGTA1q57n';

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
	return path.join(__dirname, "down", imgId+".jpg");
}

var saveImage = function(pixels, imgId){
	savePixels(pixels, "jpg").pipe(fs.createWriteStream("./down/"+imgId+".jpg"));
	return new Promise(function(resolve){
		setTimeout(resolve, 200);
	});
}

var score = function(dataById, imgIds){
	return function(inner, outer){
		var numData = dataById[imgIds[0]].length;
		var value = imgIds.reduce(function(v, imgId){
			for(var i=0; i<numData; i++){
				v = v + 255 - Math.abs(dataById[inner][i] - dataById[outer][i]);
			}
			return v;
		}, 0);

		return value / imgIds.length;
	}
}

var STRIPE_SIZE = 5;

co(function*(){

	var imgIds = (yield new Promise(function(resolve, reject){
		fs.readdir(path.join(__dirname, "down"), function(err, files){
			if(err){
				reject(err);
			}
			else{
				resolve(files);
			}
		});
	})).reduce(function(v, name){
		var data = name.split('.');
		if(data[1] === 'jpg'){
			v.push(data[0]);
		}
		return v;
	}, []);

	var top3Percent = Math.floor(imgIds.length * .97);

	var dataById = {};

	var graph = ngraph();

	console.log('>>>>>>> collecting values');
	for(var i=0; i < imgIds.length; i++){
		var imgId = imgIds[i];
		var imgPath = getPath(imgId);
		var img = yield getBasePixels(imgPath);

		var data = [];
		for(var p = 0; p < 640; p += STRIPE_SIZE){
			data.push(img.get(p+2, p+2, 1));
		}

		dataById[imgId] = data;
		graph.addNode(imgId);
		if(i%30 === 0){
			console.log((100/imgIds.length) * i);
		}
	}

	var scorer = score(dataById, imgIds);

	console.log('>>>>>>> building graph');
	for(var i=0; i < imgIds.length; i++){
		var outer = imgIds[i];
		var scoresByImg = {};
		var values = [];

		for(var j=0; j<imgIds.length; j++){
			var inner = imgIds[j];
			var value = inner !== outer ? scorer(outer, inner) : 0;
			values.push(value);
			scoresByImg[inner] = value;
		}

		values.sort(function(a, b){ return a-b; });

		var minEdgeValue = values[top3Percent];

		for(var j=0; j<imgIds.length; j++){
			var inner = imgIds[j];
			if(scoresByImg[inner] >= minEdgeValue){
				graph.addLink(outer, inner, scoresByImg[inner]);
			}
		}

		if(i%5 === 0){
			console.log((100/imgIds.length) * i);
		}
	}

	console.log('finding communities');
	var modularity = new Modularity();
	var communities = modularity.execute(graph);
	fs.writeFileSync(path.join(__dirname, 'communities.json'), JSON.stringify(communities, null, 2));

}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});