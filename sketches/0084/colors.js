var encode = function(r,g,b){
	return r | g << 8 | b << 16;
}

var decode = function(num){
	var b = num >> 16;
	var g = (num - (b << 16)) >> 8;
	var r = num - (b << 16) - (g << 8);
	return [r, g, b];
}

var compare = function(a, b){
	var val = (((a & b) | (~a & ~b)) << 8) >>> 8;
	var decoded = decode(val);
	var sum = decoded[0] + decoded[1] + decoded[2];
	return sum;
}

module.exports = {
	encode: encode,
	decode: decode,
	compare: compare
}