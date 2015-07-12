var exec = require("child_process").exec;

module.exports = function(){

	var folder = process.cwd();

	var node = process.argv;
	var details = node.splice(1);
	var command = node.concat(process.execArgv).concat(details).join(" ").replace(folder, "");

	var sketch = folder.split("/").slice(-1)[0];

	var commit = sketch + " - " + command;

	exec("git add . && git commit -m '"+commit+"'", function(err, stdout, stderr){
		console.log(err, stdout, stderr);
	});
}