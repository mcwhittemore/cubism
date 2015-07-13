var sketchSaver = require("../../lib/sketch-saver");
var co = require("co");
var listOfImages = require("./source-images.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var groupCrome = require("../../lib/filters/group-crome");

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

	var numImgs = listOfImages.length;
	
	var imgs = [];

	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log("parse "+imgPath+" "+b+" of "+numImgs);
		var img = yield getBasePixels(imgPath);
		imgs.push(img);
	}

	var results = groupCrome(imgs, 8, 12, function(a){
		var out = 0;
		for(var i=0; i<a.length; i++){
			out += a[i];
		}
		return out+"-";
	}, 20, 20);

	for(var i=0; i<numImgs; i++){
		savePixels(results.imgs[i], "jpg").pipe(fs.createWriteStream("./imgs/"+listOfImages[i]+".jpg"));
	}

}).then(sketchSaver).catch(function(err){
	console.log(err.stack);
	sketchSaver();
});
