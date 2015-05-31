var level = require("level");

module.exports = function(path){

	var db = level(path);

	var get = function*(name){
		var promise = new Promise(function(resolve, reject){
			db.get(name, function(err, value){
				if(err){
					resolve({size:0});
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

	return {
		get: get,
		put: put,
		createKeyStream: db.createKeyStream.bind(db),
		createReadStream: db.createReadStream.bind(db)
	}
}