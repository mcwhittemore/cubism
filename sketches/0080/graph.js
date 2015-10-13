var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');

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

co(function*(){

	var imgIds = yield (new Promise(function(resolve, reject){
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

	console.log(imgIds);

}).then(sketchSaver).catch(function(err){
	console.log(err.message);
	console.log(err.stack);
	sketchSaver();
});