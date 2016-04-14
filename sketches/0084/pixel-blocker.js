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

				var toEncode = [0, 0, 0];
				var miniImg = ndarray([], [unitBlockSize, unitBlockSize, 3]);

				for(var xDeep = 0; xDeep < unitBlockSize; xDeep++){
					var xSub = (xAdd * unitBlockSize) + xDeep;;
					var x = (xBase * baseBlockSize) + xSub;
					for(var yDeep = 0; yDeep < unitBlockSize; yDeep++){
						var ySub = (yAdd * unitBlockSize) + yDeep;;
						var y = (yBase * baseBlockSize) + ySub;

						for(var c=0; c<3; c++){

							var realColor = img.get(x, y, c);

							var current = basePixels.get(xSub, ySub, c) || 0;
							var imgColor = realColor * (1/community.length);
							var after = current + imgColor;
							basePixels.set(xSub, ySub, c, after);

							toEncode[c] += realColor / (unitBlockSize * unitBlockSize);
							miniImg.set(xDeep, yDeep, c, realColor);
						}
					}
				}

				allUnits.push({
					img: miniImg,
					color: colors.encode(toEncode[0], toEncode[1], toEncode[2])
				});
			}
		}
	}

	var finalPixels = ndarray([], [baseBlockSize, baseBlockSize, 3]);

	for(var xAdd = 0; xAdd < numUnitsPerBaseSide; xAdd++){
		for(var yAdd = 0; yAdd < numUnitsPerBaseSide; yAdd++){
			var red = 0;
			var green = 0;
			var blue = 0;

			for(var xDeep = 0; xDeep < unitBlockSize; xDeep++){
				var x = (xAdd * unitBlockSize) + xDeep;
				for(var yDeep = 0; yDeep < unitBlockSize; yDeep++){
					var y = (yAdd * unitBlockSize) + yDeep;
					red += basePixels.get(x, y, 0) / (unitBlockSize * unitBlockSize);
					green += basePixels.get(x, y, 1) / (unitBlockSize * unitBlockSize);
					blue += basePixels.get(x, y, 2) / (unitBlockSize * unitBlockSize);
				}
			}

			var color = colors.encode(red, green, blue);
			var topScore = 0;
			var bestMatch = null;

			for(var i=0; i<allUnits.length; i++){
				var score = colors.compare(color, allUnits[i].color);
				if(score > topScore){
					topScore = score;
					bestMatch = allUnits[i].img;
				}
			}

			for(var xDeep = 0; xDeep < unitBlockSize; xDeep++){
				var x = (xAdd * unitBlockSize) + xDeep;
				for(var yDeep = 0; yDeep < unitBlockSize; yDeep++){
					var y = (yAdd * unitBlockSize) + yDeep;
					for(var c = 0; c < 3; c++){
						finalPixels.set(x, y, c, bestMatch.get(xDeep, yDeep, c));
					}
				}
			}
		}
	}


	return finalPixels;

}