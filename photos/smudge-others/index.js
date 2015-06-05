var co = require("co");
var savePixels = require("save-pixels");
var fs = require("fs");
var getPixels = require("./get-pixels");

var smudgeImage = require("./smudger");
var increaseContrast = require("./increase-contrast");

var box = require("./selectors/box");
var cross = require("./selectors/cross");

var lessFog = require("./lessFog");
var moreLight = require("./moreLight");

var blend = require("./blend");


co(function*(){

	// var one = yield getPixels("../eight-red/test.jpg");
	// one = smudgeImage(one, cross(3));
	// savePixels(one, "jpg").pipe(fs.createWriteStream("./results/one.jpg"));

	// var two = yield getPixels("../eight-red/test.jpg");
	// two = smudgeImage(two, box(3));
	// savePixels(two, "jpg").pipe(fs.createWriteStream("./results/two.jpg"));

	// var three = yield getPixels("../eight-red/test.jpg");
	// three = smudgeImage(three, box(3));
	// three = increaseContrast(three, .0001, .9999);
	// savePixels(three, "jpg").pipe(fs.createWriteStream("./results/three.jpg"));

	// var four = yield getPixels("../eight-red/test.jpg");
	// four = smudgeImage(four, box(3));
	// four = increaseContrast(four, .0001, .9999);
	// four = smudgeImage(four, cross(5));
	// savePixels(four, "jpg").pipe(fs.createWriteStream("./results/four.jpg"));

	// var five = yield getPixels("../eight-blue/test.jpg");
	// five = smudgeImage(five, box(3));
	// savePixels(five, "jpg").pipe(fs.createWriteStream("./results/five.jpg"));

	// var six = yield getPixels("../eight-blue/test.jpg");
	// six = smudgeImage(six, box(3));
	// six = smudgeImage(six, box(2));
	// six = smudgeImage(six, box(2));
	// savePixels(six, "jpg").pipe(fs.createWriteStream("./results/six.jpg"));

	// var seven = yield getPixels("../eight/test.jpg");
	// seven = smudgeImage(seven, box(3));
	// savePixels(seven, "jpg").pipe(fs.createWriteStream("./results/seven.jpg"));

	// var eight = yield getPixels("../nine/test.jpg");
	// eight = smudgeImage(eight, box(3));
	// savePixels(eight, "jpg").pipe(fs.createWriteStream("./results/eight.jpg"));

	// var nine = yield getPixels("../eight-green/test.jpg");
	// nine = smudgeImage(nine, box(3));
	// savePixels(nine, "jpg").pipe(fs.createWriteStream("./results/nine.jpg"));

	// var ten = yield getPixels("../eight-blue/test.jpg");
	// ten = smudgeImage(ten, box(2));
	// ten = smudgeImage(ten, box(2));
	// ten = smudgeImage(ten, box(2));
	// ten = lessFog(ten);
	// savePixels(ten, "jpg").pipe(fs.createWriteStream("./results/ten.jpg"));

	// var eleven = yield getPixels("../eight-blue/test.jpg");
	// eleven = smudgeImage(eleven, cross(3));
	// eleven = smudgeImage(eleven, cross(2));
	// eleven = smudgeImage(eleven, box(2));
	// eleven = smudgeImage(eleven, box(2));
	// eleven = smudgeImage(eleven, box(2));
	// eleven = lessFog(eleven);
	// savePixels(eleven, "jpg").pipe(fs.createWriteStream("./results/eleven.jpg"));

	// var twelve = yield getPixels("../eight-blue/test.jpg");
	// twelve = smudgeImage(twelve, box(2));
	// twelve = smudgeImage(twelve, box(2));
	// twelve = smudgeImage(twelve, box(2));
	// twelve = lessFog(twelve);
	// twelve = moreLight(twelve);
	// savePixels(twelve, "jpg").pipe(fs.createWriteStream("./results/twelve.jpg"));

	// var thirteen = yield getPixels("../eight-blue/test.jpg");
	
	// var thirteenBright = smudgeImage(thirteen, cross(5));
	// thirteenBright = smudgeImage(thirteenBright, box(5));
	// thirteenBright = smudgeImage(thirteenBright, box(5));
	// thirteenBright = lessFog(thirteenBright);
	// thirteenBright = moreLight(thirteenBright);

	// var thirteenDim = smudgeImage(thirteen, box(3));
	// thirteenDim = smudgeImage(thirteenDim, box(2));
	// thirteenDim = smudgeImage(thirteenDim, box(2));

	// var thirteenMerged = blend(thirteenDim, thirteenBright);
	// savePixels(thirteenMerged, "jpg").pipe(fs.createWriteStream("./results/thirteenMerged.jpg"));

	// var fourteen = yield getPixels("../eight-blue/test.jpg");
	// for(var i=0; i<7; i++){
	// 	fourteen = smudgeImage(fourteen, box(5));
	// 	fourteen = lessFog(fourteen);
	// 	fourteen = moreLight(fourteen);
	// }
	// savePixels(fourteen, "jpg").pipe(fs.createWriteStream("./results/fourteen.jpg"));

	var fifteen = yield getPixels("../eight-blue/test.jpg");
	fifteen = smudgeImage(fifteen, box(3));
	fifteen = smudgeImage(fifteen, box(2));
	fifteen = smudgeImage(fifteen, box(2));
	fifteen = lessFog(fifteen, 2.75);
	savePixels(fifteen, "jpg").pipe(fs.createWriteStream("./results/fifteen.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


