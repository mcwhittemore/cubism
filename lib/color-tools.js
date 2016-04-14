var rc = 0.2126;
var gc = 0.7152;
var bc = 0.0722;

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

var luminance = function(r, g, b) {
  r = r * rc;
  g = g * gc;
  b = b * bc;
  return (r + g + b) / 255;
}

var luminanceWeight = function(r, g, b) {
  return [r * (1/(gc/rc)), g, b * (1/(gc/bc))];
}

module.exports = {
  encode: encode,
  decode: decode,
  compare: compare,
  luminance: luminance,
  luminanceWeight: luminanceWeight
}
