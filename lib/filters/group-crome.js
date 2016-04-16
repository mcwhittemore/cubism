var pattern = require("../../patterns/fork");

var getColors = function(img, x, y){

	return {
		red: img.get(x, y, 0),
		green: img.get(x, y, 1),
		blue: img.get(x, y, 2)
	}

}

var blockDiff = function(a, b){
	var d = 0;
	for(var i=0; i<a.length; i++){
		d += Math.abs(a[i] - b[i]);
	}
	return d;
}

var blockMerge = function(a, b){
	var out = [];
	for(var i=0; i<a.length; i++){
		var d = Math.abs(a[i] - b[i]);
		var c = Math.ceil(d/2);
		out[i] = Math.min(a[i], b[i]) + c;
	}
	return out;
}

var findBlockRef = function(ref, links){
	if(links[ref]){
		return findBlockRef(links[ref], links);
	}
	else{
		return ref;
	}
}

var simpleBlockStringer = function(a){
	return Math.max.apply(null, a)+"-";
}

module.exports = function(imgs, numColors, blockSize, blockStringer, outerMin, innerMin){

	blockSize = blockSize || 6;
	blockStringer = blockStringer || simpleBlockStringer;
	outerMin = outerMin || numColors * 2;
	innerMin = innerMin || numColors * 2;

	var blocksByImgAndLoc = {};

	var links = {};

	var refs = [];
	var foundBlock = {};

	console.log("building refs");
	for(var i=0; i<imgs.length; i++){
		var fork = pattern(640);
		var next = fork.next();
		var block = [];
		var loc = 0;
		while(next.done === false){
			var x = next.value[0];
			var y = next.value[1];

			var colors = getColors(imgs[i], x, y);

			block = block.concat([colors.red, colors.green, colors.blue]);

			if(block.length===blockSize*3){
				var ref = i+"-"+loc;
				blocksByImgAndLoc[ref] = block;
				var blockStr = blockStringer(block);
				if(foundBlock[blockStr]){
					var rightRef = foundBlock[blockStr];
					links[ref] = rightRef;

					blocksByImgAndLoc[rightRef] = blockMerge(blocksByImgAndLoc[ref], blocksByImgAndLoc[rightRef]);
					delete blocksByImgAndLoc[ref];
				}
				else{
					foundBlock[blockStr] = ref;
					refs.push(ref);
				}
				block = [];
				loc++;
			}

			var next = fork.next();
		}
	}
	foundBlock = null;

	console.log("# refs", refs.length, "goal", numColors);
	while(refs.length > numColors){
		if(refs.length % numColors === 0){
			console.log("# refs", refs.length, "goal", numColors);
		}
		var index = 0;
		var left = refs[0];
		var right = refs[1];
		var min = blockDiff(blocksByImgAndLoc[left], blocksByImgAndLoc[right]);

		for(var i=1; i<refs.length && i<outerMin; i++){
			var a = refs[i];
			for(var j=i+1; j<refs.length && i<innerMin; j++){
				var b = refs[j];
				var d = blockDiff(blocksByImgAndLoc[a], blocksByImgAndLoc[b]);

				if(d<min){
					min = d;
					index = i;
					left = a;
					right = b;
				}
			}
		}

		links[left] = right;
		blocksByImgAndLoc[right] = blockMerge(blocksByImgAndLoc[left], blocksByImgAndLoc[right]);
		refs.splice(index, 1);
	}

	var colorList = [];
	var colorMembers = [];
	var colorsByRef = {};

	for(var i=0; i<imgs.length; i++){
		console.log("transforming i", i);
		var fork = pattern(640);
		var next = fork.next();
		var xys = [];
		var data = [];
		var loc = 0;
		while(next.done === false){
			var x = next.value[0];
			var y = next.value[1];

			xys = xys.concat([[x,y]]);

			var colors = getColors(imgs[i], x, y);

			data = data.concat([colors.red, colors.green, colors.blue]);

			if(xys.length===blockSize){
				var ref = i+"-"+loc;
				var blockRef = findBlockRef(ref, links);
				var colorId = colorsByRef[blockRef];

				if(colorId === undefined){
					colorId = colorList.length;
					colorMembers[colorId] = [];
					colorList[colorId] = blocksByImgAndLoc[blockRef];
					colorsByRef[blockRef] = colorId;
				}

				colorMembers[colorId].push(data);
				var block = colorList[colorId];

				for(var j=0; j<blockSize; j++){
					var p = j*3;
					var x = xys[j][0];
					var y = xys[j][1];
					imgs[i].set(x, y, 0, block[p]);
					imgs[i].set(x, y, 1, block[p+1]);
					imgs[i].set(x, y, 2, block[p+2]);
				}

				data = [];
				xys = [];
				loc++;
			}

			var next = fork.next();
		}
	}

	return {
		colors: colorList,
		members: colorMembers,
		imgs: imgs
	}

}
