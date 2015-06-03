module.exports = function(destPath){
	return new Promise(function(accept, reject){
		require("get-pixels")(destPath, function(err, pixels){
			if(err){
				reject(err);
			}
			else{
				accept(pixels);
			}
		});
	});
}