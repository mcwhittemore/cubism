var path = require("path");
module.exports = function(imgId){
  return path.join(__dirname, "../instagrams", imgId+".jpg");
}
