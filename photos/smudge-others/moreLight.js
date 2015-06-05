var ndarray = require("ndarray");

module.exports = function(srcImg){

	var destImg = ndarray([], [640, 640, 3]);

	var max = 0;

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var pm = Math.max(
				srcImg.get(x, y, 0),
				srcImg.get(x, y, 1),
				srcImg.get(x, y, 2)
			);

			if(pm>max){
				max = pm;
			}
		}
	}

	console.log("max", max);
	var change = 256-max;

	for(var x = 0; x<640; x++){
		for(var y = 0; y<640; y++){
			var channels = [];
			channels.push([0, srcImg.get(x, y, 0)]);
			channels.push([1, srcImg.get(x, y, 1)]);
			channels.push([2, srcImg.get(x, y, 2)]);

			channels.sort(function(a, b){
				return a[1] - b[1];
			});

			for(var c=0; c<channels.length; c++){
				var chan = channels[c];
				destImg.set(x, y, chan[0], chan[1]+((change/3)*c));
			}
		}
	}

	return destImg;
}