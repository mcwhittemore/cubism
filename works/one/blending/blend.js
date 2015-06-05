var ndarray = require("ndarray");

module.exports = function(img1, img2){

	var destImg = ndarray([], [640, 640, 3]);

	var max = 0;

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){

			var r = img1.get(x, y, 0) + img2.get(x, y, 0);
			var g = img1.get(x, y, 1) + img2.get(x, y, 1);
			var b = img1.get(x, y, 2) + img2.get(x, y, 2);

			destImg.set(x, y, 0, Math.floor(r/2));
			destImg.set(x, y, 1, Math.floor(g/2));
			destImg.set(x, y, 2, Math.floor(b/2));
		}
	}

	return destImg;
}