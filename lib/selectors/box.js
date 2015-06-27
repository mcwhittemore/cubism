module.exports = function(size){
	return function(x, y){
		
		var out =[{x:x, y:y}];

		for(var i=1; i<size; i++){
			var nx = x-i >= 0;
			var px = x+i < 640;

			var ny = y-i >= 0;
			var py = y+i < 640;

			if(nx){
				out.push({x:x-i, y:y});
			}

			if(px){
				out.push({x:x+i, y:y});
			}

			if(ny){
				out.push({x:x, y:y-i});
			}

			if(py){
				out.push({x:x, y:y+i});
			}

			if(px && py){
				out.push({x:x+i, y:y+i});
			}

			if(nx && py){
				out.push({x:x-i, y:y+i});
			}

			if(nx && ny){
				out.push({x:x-i, y:y-i});
			}

			if(px && ny){
				out.push({x:x+i, y:y-i});
			}
		}

		return out;
	}
}