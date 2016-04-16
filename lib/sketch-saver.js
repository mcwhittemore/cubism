var exec = require("child_process").exec;

var no = process.argv[process.argv.length-1];

module.exports = function(){

	if(no !== "no"){
		exec("git add .", function(err){
			if(err){
				throw err;
			}
			var folder = process.cwd();

			var node = process.argv;
			var details = node.splice(1);
			var command = node.concat(process.execArgv).concat(details).join(" ").replace(folder, "");

			var sketch = folder.split("/").slice(-1)[0];

			var commit = sketch + " - " + command;

			exec("git commit -m '"+commit+"'", function(err, stdout, stderr){
				if(err){
					console.log(err);
					console.log(stderr);
				}
			});
		});
	}

}
