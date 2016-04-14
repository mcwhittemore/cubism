var fs = require("fs");
var savePixels = require("save-pixels");

module.exports = function(pixels, path){
  savePixels(pixels, "jpg").pipe(fs.createWriteStream(path));
  return new Promise(function(resolve){
    setTimeout(resolve, 200);
  });
}
