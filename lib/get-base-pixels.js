var getPixels = require("get-pixels");

module.exports = function*(imgPath){
  return new Promise(function(accept, reject){
    getPixels(imgPath, function(err, pixels) {
      if(err) {
        reject(err);
      }
      else{
        accept(pixels);
      }
    });
  });
}
