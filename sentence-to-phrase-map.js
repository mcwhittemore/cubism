var sentence = require(process.argv[2]);

var phraseMap = {};
var phraseSize = 6;

var emitP = Math.floor(sentence.length/5);
var smallU = 100/sentence.length;

var phrase = sentence.slice(0, phraseSize).join(".");
for(var i=1; i<sentence.length-phraseSize; i++){
	var nextPhrase = sentence.slice(i, i+phraseSize).join(".");
	phraseMap[phrase] = phraseMap[phrase] || {size:0};
	phraseMap[phrase][nextPhrase] = phraseMap[phrase][nextPhrase] || 0;
	phraseMap[phrase][nextPhrase]++;
	phraseMap[phrase].size++;
	phrase = nextPhrase;

	if(i%emitP==0){
		console.error(smallU*i, "%");
	}
}

console.log(JSON.stringify(phraseMap));