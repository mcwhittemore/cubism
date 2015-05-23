module.exports = function(sentence, phraseLength){
	var phraseMap = {};

	var emitP = Math.floor(sentence.length/5);
	var smallU = 100/sentence.length;

	var tenp = Math.floor(sentence.length / 10);

	var phrase = sentence.slice(0, phraseLength).join(".");
	for(var i=1; i<sentence.length-phraseLength; i++){
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
