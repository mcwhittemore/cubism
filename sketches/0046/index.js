var co = require("co");
var monocrome = require("../../lib/filters/monocrome");
var listOfImages = require("./source-images.json");
var savePixels = require("save-pixels");
var fs = require("fs");
var path = require("path");

co(function*(){

	var numImgs = listOfImages.length;
	console.log(numImgs);
	
	for(var b=0; b<numImgs; b++){
		var imgId = listOfImages[b];
		var imgPath = path.join(__dirname, "../../instagrams", imgId+".jpg");
		console.log(imgPath);
		var img = yield monocrome(imgPath, 4);
		savePixels(img, "jpg").pipe(fs.createWriteStream("./imgs/"+imgId+"-fourth.jpg"));
	}

}).catch(function(err){
	console.log(err);
});
