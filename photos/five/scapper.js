require('dotenv').config({path: '../../.env'})
require("dotenv").load();
var ig = require('instagram-node').instagram();

ig.use({
	client_id: process.env.INSTAGRAM_CLIENT_ID,
	client_secret: process.env.INSTAGRAM_CLIENT_SECRET
});

/* OPTIONS: { [min_timestamp], [max_timestamp], [distance] }; */
var opts = {
	distance: 100000
}

ig.location_media_recent('713407313', function(err, result, remaining, limit){
	console.log("err", err);
	console.log("result", result);
});

