var co = require("co");
var savePixels = require("save-pixels");
var fs = require("fs");
var getPixels = require("./get-pixels");

var smudgeImage = require("./smudger");
var increaseContrast = require("./increase-contrast");

var box = require("./selectors/box");
var cross = require("./selectors/cross");


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

	var six = yield getPixels("../eight-blue/test.jpg");
	six = smudgeImage(six, box(3));
	six = smudgeImage(six, box(2));
	six = smudgeImage(six, box(2));
	savePixels(six, "jpg").pipe(fs.createWriteStream("./results/six.jpg"));

}).catch(function(err){
	console.error(err);
	console.error(err.stack);
	throw err;
});


