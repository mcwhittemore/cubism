var ndarray = require('ndarray');

// img is an ndarray of rgb values
// stripSize is how large the stripe should be
// stripDirection is either down or across

var NUM_BITS = 3;
var COLORS_PER_NUMBER = 10;
var SHIFT_START = 28;
var NUM_BIT_BLOCKS = Math.ceil(640/COLORS_PER_NUMBER);

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
	var xor = a ^ b;
	var hold = (xor & a) ^ xor;
	return (hold >>> 0).toString(2);
}

module.exports = function(img, stripSize, stripDirection){

	var numStripSections = Math.floor(640/stripSize);

	var data = ndarray([], [numStripSections, NUM_BIT_BLOCKS]);

	for(var i = 0; i < numStripSections; i++){
		for(var j = 0; j < NUM_BIT_BLOCKS; j++){

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

				var max = Math.max(img.get(x, y, 0), img.get(x, y, 1), img.get(x, y, 2));

				units.push(Math.floor(((max+1)/32)-1));
			}

			data.set(i, j, encode(units));
		}
	}

	return {
		findSectionMostLikeSection: function(baseSection, mathImg){
			var bestMatch = 0;
			var bestScore = 0;
			for(var i=0; i<numStripSections; i++){
				var val = 0;
				for(var j=0; j<NUM_BIT_BLOCKS; j++){
					val += compare(data.get(baseSection, j) ^ mathImg.get(i, j));
				}

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
