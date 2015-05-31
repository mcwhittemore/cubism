var keySizeCache = {};
var history = [null, null];

var gen = require("random-seed");
var rand = gen.create("123");

var logCache = {};

module.exports = function*(search, db){

	var map = yield db.get(search);

	var size = map.size || 0;
	if(map.size){
		delete map.size;
		delete map[search];
	}

	var keys = Object.keys(map);

	var subKeys = [];

	for(var i=0; i<keys.length; i++){
		var key = keys[i];
		var keySize = keySizeCache[key] || (yield db.get(key)).size;

		keySizeCache[key] = keySize;

		if(keySize>3){
			subKeys.push(key);
		}
	}

	if(logCache[search]===undefined){
		console.log(search, subKeys.length);
		logCache[search] = 1;
	}

	var out = search;
	if(subKeys.length>0){
		var keyIndex = rand(subKeys.length);
		out = subKeys[keyIndex];
		history[1] = history[0];
		history[0] = out;
	}
	else if(history[0]!==null){
		history[0] = history[1];
		history[1] = null;
		out = history[0];
	}

	return out;

}