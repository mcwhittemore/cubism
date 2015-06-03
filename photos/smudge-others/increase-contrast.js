var ndarray = require("ndarray");

module.exports = function(srcImg, minPoint, maxPoint){

	var destImg = ndarray([], [640, 640, 3]);

	var vals = [];

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var r = srcImg.get(x, y, 0);
			var g = srcImg.get(x, y, 1);
			var b = srcImg.get(x, y, 2);

			vals.push(r);
			vals.push(g);
			vals.push(b);
		}
	}

	vals.sort();

	var min = vals[Math.floor(vals.length*minPoint)];
	var max = vals[Math.ceil(vals.length*maxPoint)];

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