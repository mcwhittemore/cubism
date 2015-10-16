var ndarray = require('ndarray');

var NUM_BITS = 6;
var COLORS_PER_NUMBER = 5;
var SHIFT_START = 25;

var encode = function(nums){
	var out = 0;
	for(var i=0; i<COLORS_PER_NUMBER; i++){
		out |= nums[i] << (SHIFT_START - (i * NUM_BITS));
	}
	return out;
}

var decode = function(input){
	var out = [];
	for(var i = 0; i<COLORS_PER_NUMBER; i++){
		var modIn = input;
		for(var j=0; j<i; j++){
			modIn -= out[j] << (SHIFT_START - (j * NUM_BITS));
		}
		out.push(modIn >> (SHIFT_START - (i * NUM_BITS)));
	}
	return out;
}

var compare = function(a, b){
	return decode((((a & b) | (~a & ~b)) << 1) >>> 1).reduce(function(v, p){ return v+p; }, 0);
}

// img is an ndarray of rgb values
// stripSize is how large the stripe should be
// stripDirection is either down or across

module.exports = function(img, stripSize, stripDirection){

	var chunkSize = stripDirection === 'down' ? img.shape[0] : img.shape[1];

	var numBitsPerBlock = Math.ceil(chunkSize/COLORS_PER_NUMBER);

	var numStripSections = Math.floor(chunkSize/stripSize);

	var data = ndarray([], [numStripSections, numBitsPerBlock]);

	for(var i = 0; i < numStripSections; i++){
		for(var j = 0; j < numBitsPerBlock; j++){

			var units = [];

			for(var k = 0; k < COLORS_PER_NUMBER; k++){
				var x;
				var y;
				var shift = SHIFT_START - (k * NUM_BITS);

				if(stripDirection === 'down'){
					x = i * stripSize;
					y = (j * COLORS_PER_NUMBER) + k;
				}
				else{
					y = i * stripSize;
					x = (j * COLORS_PER_NUMBER) + k;
				}

				var max = img.get(x, y, 1); //Math.max(img.get(x, y, 0), img.get(x, y, 1), img.get(x, y, 2));

				units.push(Math.floor(((max+1)/4)-1));
			}

			data.set(i, j, encode(units));
		}
	}

	var halfCache = [];

	return {
		numSections: numStripSections,
		findSectionMostLikeSection: function(baseSection, other, fn){
			var bestMatch = 0;
			var bestScore = 0;
			for(var i=0; i<numStripSections; i++){
				var val = 0;
				for(var j=0; j<numBitsPerBlock; j++){
					val += compare(data.get(baseSection, j), other.get(i, j));
				}

				val = fn(val, i);

				if(val > bestScore){
					bestScore = val;
					bestMatch = i;
				}
			}

			return {
				score: bestScore,
				section: bestMatch
			}
		},
		get: function(i, j){
			return data.get(i, j);
		}
	}
}

module.exports.encode = encode;
module.exports.decode = decode;
module.exports.compare = compare;
