var getPixels = require("get-pixels");
var pattern = require("./pattern.json");
 
getPixels(process.argv[2], function(err, pixels) {
  if(err) {
    console.log("Bad image path");
    return
  }

  var bits = [];
  var sentence = [];

  var ll = 640;
  var bs = 8*4;

  for(var i=0; i<pattern.length; i++){
  	var seq = pattern[i];
  	var bit = [];
  	for(var j=0; j<seq.length; j++){
  		var block = seq[j];
  		var x = block[0];
  		var y = block[1];
  		var pos = (y*ll*4)+(x*bs);

  		var r = []
  		var g = [];
  		var b = [];

  		for(var yy=0; yy<8; yy++){
  			for(var xx=0; xx<8; xx++){
  				var k = pos+(yy*ll*4)+(xx*4);
  				r.push(pixels.data[k]);
  				g.push(pixels.data[k+1]);
  				b.push(pixels.data[k+2]);
  			}
  		}

  		var ra = Math.floor(r.reduce(function(b,n){ return b+n; }) / r.length);
  		var ga = Math.floor(g.reduce(function(b,n){ return b+n; }) / g.length);
  		var ba = Math.floor(b.reduce(function(b,n){ return b+n; }) / b.length);

  		r.sort(function(a,b){
  			var av = Math.abs(a-ra);
  			var bv = Math.abs(b-ra);
  			return bv-av;
  		});

  		g.sort(function(a,b){
  			var av = Math.abs(a-ga);
  			var bv = Math.abs(b-ga);
  			return bv-av;
  		});

  		b.sort(function(a,b){
  			var av = Math.abs(a-ba);
  			var bv = Math.abs(b-ba);
  			return bv-av;
  		});

  		var rv = Math.ceil((r[0]+ra)/2);
  		var gv = Math.ceil((g[0]+ga)/2);
  		var bv = Math.ceil((b[0]+ba)/2);

  		var rgb = "rgb("+rv+","+gv+","+bv+")";
  		bit.push([block[0],block[1],rgb]);
  		sentence.push(rgb);
  	}
  	bits.push(bit);
  }

  if(process.argv[3]==="bits"){
    console.log("window.bits = "+JSON.stringify(bits));
  }
  else{
    console.log(JSON.stringify(sentence));
  }

});