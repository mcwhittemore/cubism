var blank = null;

module.exports = function*(search, db, getVal){
	if(blank===null){
		blank = search;
	}

	var map = yield db.get(search);
	var size = map.size || 0;
	if(map.size){
		delete map.size;
		delete map[search];
	}

	var keys = Object.keys(map);

	var out = blank;
	var count = null;
	for(var i=0; i<keys.length; i++){

		var key = keys[i];
		if(key.split(".").length==25){

			var keyVal = getVal(keys[i]);
			if(out == blank){
				out = key;
				count = keyVal;
			}
			else if(keyVal<count){
				out = key;
				count = keyVal;
			}

		}
	}

	return out;
}