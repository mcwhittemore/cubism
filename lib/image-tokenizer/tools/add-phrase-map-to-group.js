module.exports = function* (map, db){

	var keys = Object.keys(map);

	var count = 0;
	var part = 5;
	var tenp = Math.floor(keys.length / 10);

	for(var i=0; i<keys.length; i++){
		var key = keys[i];

		var inMap = map[key];
		var inDb = yield db.get(key);
		
		var mapKeys = Object.keys(inMap);

		for(var j=0; j<mapKeys.length; j++){
			var mk = mapKeys[j];
			inDb[mk] = (~~inDb[mk]) + inMap[mk];
		}

		yield db.put(key, inDb);

		if(i%tenp==0){
			process.stdout.write(" "+Math.ceil((100/keys.length)*i));
		}

	}
}
