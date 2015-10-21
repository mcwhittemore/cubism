var ndarray = require('ndarray');
var colors = require('./colors');

module.exports = function(imgsById, community, xBase, yBase, baseBlockSize, unitBlockSize){

	var basePixels = ndarray([], [baseBlockSize, baseBlockSize, 3]);

	var allUnits = [];

	var numUnitsPerBaseSide = Math.floor(baseBlockSize / unitBlockSize);

	for(var j=0; j<community.length; j++){
		var imgId = community[j];
		var img = imgsById[imgId];

		for(var xAdd = 0; xAdd < numUnitsPerBaseSide; xAdd++){
			for(var yAdd = 0; yAdd < numUnitsPerBaseSide; yAdd++){

				//red, green, blue

				for(var xDeep = 0; xDeep < unitBlockSize; xDeep++){
					var xSub = (xAdd * unitBlockSize) + xDeep;;
					var x = (xBase * baseBlockSize) + xSub;
					for(var yDeep = 0; yDeep < unitBlockSize; yDeep++){
						var ySub = (yAdd * unitBlockSize) + yDeep;;
						var y = (yBase * baseBlockSize) + ySub;

						for(var c=0; c<3; c++){
							var current = basePixels.get(xSub, ySub, c) || 0;
							var imgColor = img.get(x, y, c) * (1/community.length);
							var after = current + imgColor;
							basePixels.set(xSub, ySub, c, after);
						}
					}
				}
			}
		}
	}

	// var baseColorsByUnit = ndarray([], [numUnitsPerBaseSide, numUnitsPerBaseSide]);

	// for(var xAdd = 0; xAdd < numUnitsPerBaseSide; xAdd++){
	// 	for(var yAdd = 0; yAdd < numUnitsPerBaseSide; yAdd++){
	// 		var red = 0;
	// 		var blue = 0;
	// 		var green = 0;

	// 		for(var xDeep = 0; xDeep < unitBlockSize; xDeep++){
	// 			var x = (xAdd * unitBlockSize) + xDeep;
	// 			for(var yDeep = 0; yDeep < unitBlockSize; yDeep++){
	// 				var y = (yAdd * unitBlockSize) + yDeep;
	// 				red += basePixels.get(x, y, 0) / (unitBlockSize * unitBlockSize);
	// 				green += basePixels.get(x, y, 1) / (unitBlockSize * unitBlockSize);
	// 				blue += basePixels.get(x, y, 2) / (unitBlockSize * unitBlockSize);
	// 			}
	// 		}

	// 		baseColorsByUnit.set(xAdd, yAdd, colors.encode(red, green, blue));
	// 	}
	// }


	return basePixels;

}