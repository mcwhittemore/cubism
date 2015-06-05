var ndarray = require("ndarray");

module.exports = function(srcImg, minPoint, maxPoint){

	var destImg = ndarray([], [640, 640, 3]);

	var min = 256;
	var max = 0;

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var pmin = Math.min(
				srcImg.get(x, y, 0),
				srcImg.get(x, y, 1),
				srcImg.get(x, y, 2)
			);

			if(pmin<min){
				min = pmin;
			}

			var pmax = Math.max(
				srcImg.get(x, y, 0),
				srcImg.get(x, y, 1),
				srcImg.get(x, y, 2)
			);

			if(pmax>max){
				max = pmax;
			}
		}
	}

	console.log("min", min);
	console.log("max", max);

	var fullScope = max-min;
	var scale = (1/fullScope)*255;

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var r = srcImg.get(x, y, 0)-min;
			var g = srcImg.get(x, y, 1)-min;
			var b = srcImg.get(x, y, 2)-min;

			var p = Math.max(r, g, b)

			r = r < 0 ? 0 : r;
			g = g < 0 ? 0 : g;
			b = b < 0 ? 0 : b;

			r = r * scale;
			g = g * scale;
			b = b * scale;

			r = Math.ceil(r > 255 ? 255 : r);
			g = Math.ceil(g > 255 ? 255 : g);
			b = Math.ceil(b > 255 ? 255 : b);

			var c = Math.max(r, g, b);

			var d = c-p;

			destImg.set(x, y, 0, r+d);
			destImg.set(x, y, 1, g+d);
			destImg.set(x, y, 2, b+d);
		}
	}

	return destImg;
}