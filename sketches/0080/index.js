var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./image-ids.json");
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

co(function*(){
	var numImages = 20;
	var starterId = '7LGTA1q57n';

	var imgs = [];

	var imgIds = [];
	while(imgIds.length < numImages){
		var i = Math.floor(Math.random()*listOfImages.length);
		var imgId = listOfImages[i];
		if(imgId != starterId && imgIds.indexOf(imgId) === -1){
			imgIds.push(imgId);
		}
	}

	imgIds = [starterId].concat(imgIds.sort());

	for(var i=0; i<imgIds.length; i++){
		var imgId = imgIds[i];
		var imgPath = getPath(imgId);
		
		try{
			var img = yield getBasePixels(imgPath);
		}
		catch(err){
			console.error('bad image', imgId, i+'/'+imgIds.length);
		}
		
		imgs.push(img);
	}

	savePixels(imgs[0], "jpg").pipe(fs.createWriteStream("./end.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err);
	sketchSaver();
});