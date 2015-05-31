var path = require("path");
var imgToSentence = require("./tools/img-to-sentence");

module.exports = function*(pattern, listOfImages, blockLength, db){

	var imgPaths = listOfImages.map(function(imgId){
		return path.join(__dirname, "../../instagrams", imgId+".jpg");
	});

	for(var i=0; i<imgPaths.length; i++){
		console.log("Processing:", imgPaths[i], i, "of", imgPaths.length);
		console.time("img-process");
		console.log("\tConverting to sentence");
		var sentence = yield imgToSentence(pattern, imgPaths[i]);

		console.log("Converting to block and adding to db:", imgPaths[i]);
		var numBlocks = Math.floor(sentence/blockLength);
		console.time("add-one-to-db");
		for(var j=0; j<sentence.length; j+=blockLength){
			var blockList = [];
			for(var k=j; k<j+blockLength; k++){
				blockList.push(sentence[k]);
			}
			//dont use map, fake an array
			var blockMap = yield db.get("B-"+j);
			blockMap[blockMap.size+""] = blockList;
			blockMap.size++;
			yield db.put("B-"+j, blockMap);
		}
		console.timeEnd("add-one-to-db");
	}
}