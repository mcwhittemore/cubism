var rc = 0.2126;
var gc = 0.7152;
var bc = 0.0722;

var encode = function(r,g,b){
	r = Math.floor(r * rc);
	g = Math.floor(g * gc);
	b = Math.floor(b * bc);
	return r | g << 8 | b << 16;
}

var decode = function(num){
	var b = (num >> 16) / rc;
	var g = ((num - (b << 16)) >> 8) / gc;
	var r = (num - (b << 16) - (g << 8)) / bc;
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
