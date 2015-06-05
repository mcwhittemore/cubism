var ndarray = require("ndarray");

module.exports = function(srcImg, scale){
	scale = scale || 1;

	var destImg = ndarray([], [640, 640, 3]);

	var min = 256;

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var pm = Math.min(
				srcImg.get(x, y, 0),
				srcImg.get(x, y, 1),
				srcImg.get(x, y, 2)
			);

			if(pm<min){
				min = pm;
			}
		}
	}

	min = min / scale;
	console.log("min", min);

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var channels = [];
			channels.push([0, srcImg.get(x, y, 0)]);
			channels.push([1, srcImg.get(x, y, 1)]);
			channels.push([2, srcImg.get(x, y, 2)]);

			channels.sort(function(a, b){
				return b[1] - a[1];
			});

			for(var c=0; c<channels.length; c++){
				var chan = channels[c];
				destImg.set(x, y, chan[0], Math.floor(chan[1]-((min/3)*c)));
			}
		}
	}

	return destImg;
}