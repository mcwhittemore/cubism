var co = require("co");
var level = require("level");
var db = level("./"+process.argv[2]+"/gpm");

var get = function*(name){
	var promise = new Promise(function(resolve, reject){
		db.get(name, function(err, value){
			if(err){
				resolve({});
			}
			else{
				resolve(JSON.parse(value));
			}
		});
	});
	return promise;
}

var cache = {};
var blank = "#ffffff.#ffffff.#ffffff.#ffffff.#ffffff.#ffffff";
var findChoice = function*(search){

	if(cache[search] == blank){
		return blank;
	}
	else{
		var map = yield get(search);
		var size = map.size || 0;
		if(map.size){
			delete map.size;
			delete map[search];
		}

		if(cache[search]){
			delete map[cache[search]];
		}

		var keys = Object.keys(map);

		var out = cache[search] || blank;
		if(keys.length>0){
			out = keys[0];
			var count = parseInt(keys[0].split(".")[5].split("0")[0], 16);

			for(var i=1; i<keys.length; i++){
				var blueValue = parseInt(keys[i].split(".")[5].split("0")[0], 16);
				if(blueValue<count){
					out = keys[i];
					count = blueValue;
				}
			}
		}

		cache[search] = out;
		return cache[search];
	}


}

co(function*(){
	var pattern = require("./"+process.argv[3]+"/pattern.json");

	var topKey = "#a0b090.#a0b090.#a0b0a0.#a0b090.#a0b0a0.#a0b0a0";

	var keyBits = topKey.split(".");
	var list = [
		[pattern[0][0], pattern[0][1], keyBits[0]],
		[pattern[1][0], pattern[1][1], keyBits[1]],
		[pattern[2][0], pattern[2][1], keyBits[2]],
		[pattern[3][0], pattern[3][1], keyBits[3]],
		[pattern[4][0], pattern[4][1], keyBits[4]],
		[pattern[5][0], pattern[5][1], keyBits[5]]
	];

	var tenp = Math.floor(pattern.length / 10);

	for(var i=6; i<pattern.length; i++){
		var baseKey = yield findChoice(topKey, i);
		var baseBits = baseKey.split(".");
		topKey = baseKey;

		list.push([pattern[i][0], pattern[i][1], baseBits[5]]);

		if(i%tenp==0){
			console.error((100/pattern.length)*i);
		}
	}

	console.log("window.list = ", JSON.stringify(list));
}).catch(function(err){
	console.error(err.stack);
	throw err;
});

