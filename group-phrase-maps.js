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

var put = function*(name, value){
	var promise = new Promise(function(resolve, reject){
		db.put(name, JSON.stringify(value), function(err){
			if(err){
				reject(err);
			}
			else{
				resolve();
			}
		});
	});
	return promise;
}

var addMapToDB = function* (map){
	var keys = Object.keys(map);

	var count = 0;
	var part = 5;
	var op = Math.floor(keys.length/part);

	for(var i=0; i<keys.length; i++){
		var key = keys[i];

		var inMap = map[key];
		var inDb = yield get(key);
		
		var mapKeys = Object.keys(inMap);

		for(var j=0; j<mapKeys.length; j++){
			var mk = mapKeys[j];
			inDb[mk] = (~~inDb[mk]) + inMap[mk];
		}

		yield put(key, inDb);

		if(i%op==0){
			count += part;
			process.stderr.write(" "+count);
		}

	}
}

var sourceImages = require("./"+process.argv[2]+"/source-images.json");

console.error("NUMBER OF IMAGES", sourceImages.length);

co(function*(){

	for(var i=0; i<sourceImages.length; i++){
		var imgKey = sourceImages[i];
		var mapPath = "./phrase-maps/"+imgKey+".json";
		var map = readMap(mapPath);
		console.time("addMapToDB");
		yield addMapToDB(map);
		console.timeEnd("addMapToDB");
	}

}).catch(function(err){
	console.error(err);
	throw error;
});

function readMap(path){
	var fs = require("fs");
	console.error("READING", path);
	console.time("read");
	var file = fs.readFileSync(path);
	console.timeEnd("read");
	console.error("PARSEING MAP");
	console.time("parse");
	var map = JSON.parse(file);
	console.timeEnd("parse");
	console.error("PARSED");
	return map;
}
