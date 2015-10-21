var request = require('request');
var fs = require('fs');
var path = require('path');

var jsonFile = path.join(process.cwd(), process.argv[2]);

var keys = require(jsonFile);

keys.forEach(function(key){
	request("https://instagram.com/p/"+key+"/", function(err, data){
		if(err){
			console.log(key, err);
		}
		else{
			try{
				var bits = data.body.split('<meta property="og:image" content="');
				var url = bits[1].split('" />')[0];
				var output = fs.createWriteStream(path.join(__dirname, '..', 'instagrams', key+'.jpg'));
				request(url).pipe(output);
			}
			catch(err){
				console.log(key, err);
			}
		}
	});
});
