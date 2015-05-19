var getPixels = require("get-pixels");
var pattern = require("./fork/pattern.json");
 
getPixels(process.argv[2], function(err, pixels) {
  if(err) {
    console.log("Bad image path");
    return
  }

  var list = [];
  var sentence = [];

  var ll = 640;
  var bs = 4;

  for(var i=0; i<pattern.length; i++){
  		var block = pattern[i];
  		var x = block[0];
  		var y = block[1];
  		var pos = (y*ll*4)+(x*bs);

  		var r = Math.floor(pixels.data[pos]/10)*10;
      var g = Math.floor(pixels.data[pos+1]/10)*10;
      var b = Math.floor(pixels.data[pos+2]/10)*10;

  		var rgb = "rgb("+r+","+g+","+b+")";
  		list.push([block[0],block[1],rgb]);
  		sentence.push(rgb);
  }

  if(process.argv[3]==="list"){
    console.log("window.list = "+JSON.stringify(list));
  }
  else{
    console.log(JSON.stringify(sentence));
  }

});