var ndarray = require('ndarray');

module.exports = function(imgsById, community, xBase, yBase, baseBlockSize, unitBlockSize){

	var basePixels = ndarray([], [baseBlockSize, baseBlockSize, 3]);

	for(var j=0; j<community.length; j++){
		var imgId = community[j];
		var img = imgsById[imgId];

		for(var xAdd = 0; xAdd < baseBlockSize; xAdd++){
			var x = (xBase * baseBlockSize) + xAdd;
			for(var yAdd = 0; yAdd < baseBlockSize; yAdd++){
				var y = (yBase * baseBlockSize) + yAdd;

				for(var c=0; c<3; c++){
					var current = pixelBlock.get(xAdd, yAdd, c) || 0;
					var imgColor = img.get(x, y, c) * (1/community.length);
					var after = current + imgColor;
					pixelBlock.set(xAdd, yAdd, c, after);
				}
			}
		}
	}

	return basePixels;

}