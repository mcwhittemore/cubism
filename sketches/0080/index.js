var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = Object.keys(require("../../image-sets/washington-monument-8-29-15-9-10-15.json"));
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

	//7LGTA1q57n.jpg

	var imgs = [];

	for(var i=0; i<listOfImages.length; i++){
		var imgId = listOfImages[i];
		var imgPath = getPath(imgId);
		
		try{
			var img = yield getBasePixels(imgPath);
		}
		catch(err){
			console.error('bad image', imgId, i+'/'+listOfImages.length);
		}
		
		console.log(imgId);
		imgs.push(img);
	}

	savePixels(imgs[0], "jpg").pipe(fs.createWriteStream("./end.jpg"));

}).then(sketchSaver).catch(function(err){
	console.log(err);
	sketchSaver();
});