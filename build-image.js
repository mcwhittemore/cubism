var sourceImages = require("./"+process.argv[2]+"/source-images.json");
var pattern = require("./"+process.argv[3]+"/pattern.json");

var cache = {};
var phraseMap = {};
var topKey = null;

var phraseMaps = [];
var phraseMapKeys = [];

console.error("NUMBER OF IMAGES", sourceImages.length);

console.error("LOADING PHRASE MAPS");
for(var i=0; i<9; i++){
	var imgKey = sourceImages[i];
	var mapPath = "./phrase-maps/"+imgKey+".json";

	console.error("\t", mapPath, i);
	var start = Date.now();
	var smallMap = require(mapPath);
	var keys = Object.keys(smallMap);
	phraseMaps.push(smallMap);
	phraseMapKeys.push(keys);
	console.error("\t\t", Date.now()-start);
}

topKey = keys[0];

var keyBits = topKey.split(".");
var list = [
	[pattern[0][0], pattern[0][1], keyBits[0]],
	[pattern[1][0], pattern[1][1], keyBits[1]],
	[pattern[2][0], pattern[2][1], keyBits[2]],
	[pattern[3][0], pattern[3][1], keyBits[3]],
	[pattern[4][0], pattern[4][1], keyBits[4]],
	[pattern[5][0], pattern[5][1], keyBits[5]],
];

console.error("BUILDING LIST", 16);
var onlyWhite = false;
for(var i=6; i<pattern.length; i++){
	var baseKey = findChoice(topKey, i);
	var baseBits = baseKey.split(".");
	topKey = baseKey;

	list.push([pattern[i][0], pattern[i][1], baseBits[5]]);
}

console.log(JSON.stringify(list));

function findChoice(topKey){

	if(cache[topKey]){
		return cache[topKey];
	}
	else{

		var scores = {};
		var allKeys = [];

		for(var i=0; i<phraseMaps.length; i++){
			var phraseMap = phraseMaps[i];
			var keys = phraseMapKeys[i];
			for(var j=0; j<keys.length; j++){
				var key = keys[j];
				if(key !== topKey && key!=="size"){
					var score = 0;
					if(phraseMap[topKey]!==undefined && phraseMap[topKey][key] !== undefined){
						score = phraseMap[topKey][key];
					}

					if(scores[key] === undefined){
						allKeys.push(key);
						scores[key] = 0;
					}

					scores[key] = scores[key] + score;
				}
			}
		}

		var out = allKeys[0];
		var size = scores[out];

		for(var i=1; i<allKeys.length; i++){
			var key = allKeys[i];
			if(scores[key] > size){
				size = scores[key];
				out = key;
			}
		}


		console.error("\t\t", topKey, "FRESH", i);
		cache[topKey] = out || "#ffffff.#ffffff.#ffffff.#ffffff.#ffffff.#ffffff";
		return cache[topKey];
	}
}

function merge(a, b){
	var keys = Object.keys(b);

	for(var i=0; i<keys.length; i++){
		var key = keys[i];
		a[key] = (a[key] || 0) + b[key];
	}

	return a;
}