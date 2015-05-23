var rand = require("random-seed").create("picker");

var cache = {};
var blank = "ff-ff-ff.ff-ff-ff.ff-ff-ff.ff-ff-ff.ff-ff-ff.ff-ff-ff";

module.exports = function*(search, db){

	if(cache[search] == blank){
		return blank;
	}
	else{
		var map = yield db.get(search);
		var size = map.size || 0;
		if(map.size){
			delete map.size;
		}

		var keys = Object.keys(map);

		var out = cache[search] || blank;
		if(keys.length>0){
			var loc = rand(keys.length);
			out = keys[loc];
		}

		cache[search] = out;
		return cache[search];
	}
}