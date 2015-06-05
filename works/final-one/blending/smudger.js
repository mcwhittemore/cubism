var ndarray = require("ndarray");

module.exports = function (srcImg, getPoints){
	var destImg = ndarray([], [640, 640, 3]);

	for(var x=0; x<640; x++){
		for(var y=0; y<640; y++){
			var points = getPoints(x, y);

			var red = [];
			var green = [];
			var blue = [];

			for(var i=0; i<points.length; i++){
				var point = points[i];
				red.push(srcImg.get(point.x, point.y, 0));
				green.push(srcImg.get(point.x, point.y, 1));
				blue.push(srcImg.get(point.x, point.y, 2));
			}

			var redTotal = red.reduce(function(a,b){ return a+b; }, 0);
			var greenTotal = green.reduce(function(a,b){ return a+b; }, 0);
			var blueTotal = blue.reduce(function(a,b){ return a+b; }, 0);

			var redValue = Math.floor(redTotal/red.length);
			var greenValue = Math.floor(greenTotal/green.length);
			var blueValue = Math.floor(blueTotal/blue.length);

			destImg.set(x, y, 0, redValue);
			destImg.set(x, y, 1, greenValue);
			destImg.set(x, y, 2, blueValue);

		}

	}

	return destImg;
	
}