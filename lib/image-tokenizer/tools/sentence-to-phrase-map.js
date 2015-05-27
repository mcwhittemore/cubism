module.exports = function(sentence, phraseLength, phraseIterationSize){
	phraseIterationSize = phraseIterationSize || 1;
	var phraseMap = {};
	var tenp = Math.floor(sentence.length / 10);
	var phrase = sentence.slice(0, phraseLength).join(".");

	for(var i=phraseIterationSize; i<sentence.length-phraseLength; i+=phraseIterationSize){
		var nextPhrase = sentence.slice(i, i+phraseLength).join(".");
		phraseMap[phrase] = phraseMap[phrase] || {size:0};
		phraseMap[phrase][nextPhrase] = phraseMap[phrase][nextPhrase] || 0;
		phraseMap[phrase][nextPhrase]++;
		phraseMap[phrase].size++;
		phrase = nextPhrase;

		if(i%tenp==0){
			process.stdout.write(" "+Math.ceil((100/sentence.length)*i));
		}
	}

	return phraseMap;
}
