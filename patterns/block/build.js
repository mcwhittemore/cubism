var bits = [[]];

var colors = [
	"#ff00ff",
	"#00ffff",
	"#ffff00"
];

function setBlock(x, y){
	var i = bits.length-1;
	var color = colors[i%colors.length];
    var bit = [
    	[x-2,y-2],
    	[x-1,y-2],
    	[x,y-2],
    	[x+1,y-2],
    	[x+2,y-2],

    	[x-2,y-1],
    	[x-1,y-1],
    	[x,y-1],
    	[x+1,y-1],
    	[x+2,y-1],

    	[x-2,y],
    	[x-1,y],
    	[x,y],
    	[x+1,y],
    	[x+2,y],

    	[x-2,y+2],
    	[x-1,y+2],
    	[x,y+2],
    	[x+1,y+2],
    	[x+2,y+2],

    	[x-2,y+1],
    	[x-1,y+1],
    	[x,y+1],
    	[x+1,y+1],
    	[x+2,y+1]
    ];
    bits[i]=bit;
}

var x = 320;
var y = 320;
var s = 0;
var fn = 0;

var funcs = [
	function(x, y, s){ 
		return {
			x: x+5,
			y: y,
			s: s
		}
	},
	function(x, y, s){
		return {
			x: x,
			y: y+5,
			s: s+1
		}
	},
	function(x, y, s){
		return {
			x: x-5,
			y: y,
			s: s
		}
	},
	function(x, y, s){
		return {
			x: x,
			y: y-5,
			s: s+1
		}
	}
];

setBlock(x,y);
bits.push([]);

for(var i=0; i<852; i++){
	var func = funcs[fn];
	var info = func(x, y, s);
	var x = info.x;
	var y = info.y;
	var s = info.s;
	setBlock(x,y);
	bits.push([]);
	for(var j=1; j<s; j++){
		var info = func(x, y, s);
		var x = info.x;
		var y = info.y;
		setBlock(x,y);
		bits.push([]);
	}

	fn++;
	if(fn==funcs.length){ fn = 0; }
}

var list = [];
for(var i=0; i<bits.length; i++){
  var bit = bits[i];
  for(var j=0; j<bit.length; j++){
    var it = bit[j];
    if(it[0]>=0&&it[0]<640){
      if(it[1]>=0&&it[1]<640){
        list.push(it);
      }
    }
  }
}

console.log(JSON.stringify(list));