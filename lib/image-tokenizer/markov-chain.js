var path = require("path");
var imgToSentence = require("./tools/img-to-sentence");
var sentenceToPhraseMap = require("./tools/sentence-to-phrase-map");
var addPhraseMapToGroup = require("./tools/add-phrase-map-to-group");

module.exports = function*(pattern, listOfImages, phraseLength, db){

	var imgPaths = listOfImages.map(function(imgId){
		return path.join(__dirname, "../../instagrams", imgId+".jpg");
	});

	for(var i=0; i<imgPaths.length; i++){
		console.log("Processing:", imgPaths[i], i, "of", imgPaths.length);
		console.time("img-process");
		console.log("\tConverting to sentence");
		var sentence = yield imgToSentence(pattern, imgPaths[i]);
		
		process.stdout.write("\tConverting to phrase map:");
		console.time("to-map");
		var map = sentenceToPhraseMap(sentence, phraseLength);
		console.timeEnd("to-map");

		process.stdout.write("\tAdding phrase map to group:");
		console.time("to-group");
		yield addPhraseMapToGroup(map, db);
		console.timeEnd("to-group");
		console.timeEnd("img-process");
	}
}