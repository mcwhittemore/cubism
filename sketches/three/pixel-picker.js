var cache = {};
var blank = "ff-ff-ff.ff-ff-ff.ff-ff-ff.ff-ff-ff.ff-ff-ff.ff-ff-ff";

module.exports = function*(search, db, getVal){

	if(cache[search] == blank){
		return blank;
	}
	else{
		var map = yield db.get(search);
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
			var count = getVal(out);

			for(var i=1; i<keys.length; i++){
				var blueValue = getVal(keys[i]);
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