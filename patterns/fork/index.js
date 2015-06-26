var funcs = [
	function(x, y, s){ 
		return {
			x: x+2,
			y: y+2,
			s: s+1
		}
	},
	function(x, y, s){
		return {
			x: x-3,
			y: y,
			s: s
		}
	},
	function(x, y, s){
		return {
			x: x-2,
			y: y-2,
			s: s+1
		}
	},
	function(x, y, s){
		return {
			x: x+3,
			y: y,
			s: s
		}
	}
];

module.exports = function*(size){

	var x = Math.floor(size/2);
	var y = x;
	var s = 0;
	var fn = 0;

	var broken = {
		north: false,
		east: false,
		south: false,
		west: false
	}

	function getBits(x, y){
		var bits = [
			[x-2,y],
			[x-1,y],
			[x,y],
			[x,y-1],
			[x,y+1],
			[x+1,y+1]
		];

		var out = [];
		var notSafe = true;

		for(var i=0; i<bits.length; i++){
			var it = bits[i];
			if(it[0] >= 0 && it[0] < size && it[1] >= 0 && it[1] < size){
				out.push(it);
				notSafe = false;
				broken.north = false;
				broken.east = false;
				broken.south = false;
				broken.west = false;
			}
			else if(notSafe){
				if(it[0] < 0){
					broken.west = true;
				}

				if(it[0] >= size){
					broken.east = true;
				}

				if(it[1] < 0){
					broken.north = true;
				}

				if(it[1] >= size){
					broken.south = true;
				}
			}
		}

		return out;
	}

	yield* getBits(x,y);

	while(true){
		var func = funcs[fn];
		var info = func(x, y, s);
		var x = info.x;
		var y = info.y;
		var s = info.s;
		yield* getBits(x,y);
		for(var j=1; j<s; j++){
			var info = func(x, y, s);
			var x = info.x;
			var y = info.y;
			yield* getBits(x,y);
		}

		fn++;
		if(fn==funcs.length){ fn = 0; }

		if(broken.north && broken.east && broken.south && broken.west){
			break;
		}
	}

};