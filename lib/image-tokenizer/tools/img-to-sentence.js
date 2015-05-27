var getPixels = require("get-pixels");

module.exports = function*(pattern, imgPath){

	return new Promise(function(resolve, reject){
		getPixels(imgPath, function(err, pixels) {
			if(err) {
				reject(err);
			}
			else{
				var sentence = [];

				var ll = 640;
				var bs = 4;

				var breakDown = 16;

				for(var i=0; i<pattern.length; i++){
					var block = pattern[i];
					var x = block[0];
					var y = block[1];
					var pos = (y*ll*4)+(x*bs);

					var r = Math.floor(pixels.data[pos]/breakDown)*breakDown;
					var g = Math.floor(pixels.data[pos+1]/breakDown)*breakDown;
					var b = Math.floor(pixels.data[pos+2]/breakDown)*breakDown;

					var rgb = [r.toString(16), g.toString(16), b.toString(16)].join("-");
					sentence.push(rgb);
				}

				resolve(sentence);
			}
		});
	});

}
