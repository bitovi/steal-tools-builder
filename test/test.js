var assert = require('assert'),
	Browser = require("zombie"),
	connect = require("connect"),
	path = require('path'),
	rmdir = require('rimraf'),
	fs = require('fs'),
	stealToolsBuilder = require("../index");

// Helpers
var find = function(browser, property, callback, done){
	var start = new Date();
	var check = function(){
		if(browser.window && browser.window[property]) {
			callback(browser.window[property]);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done("failed to find "+property+" in "+browser.window.location.href);
		}
	};
	check();
};

var open = function(url, callback, done){
	var server = connect().use(connect.static(path.join(__dirname,".."))).listen(8081);
	var browser = new Browser();
	browser.visit("http://localhost:8081/"+url)
		.then(function(){
			callback(browser, function(err){
				server.close();
				done(err);
			})
		}).catch(function(e){
			server.close();
			done(e)
		});
};


(function(){




describe("builder", function(){

	it("basics should work", function(done){
		
		stealToolsBuilder({
			"pluginify": {
				"graph": {
					system: {
						main: "pluginify/pluginify",
						config: __dirname+"/stealconfig.js"
					}
				},
				"outputs": {
					"basics standalone": {
						modules: ["basics/module/module"],
						out: function(){
							return __dirname+"/out/basics.js"
						},
						minify: false
					},
					"pluginify without basics": {
						modules: ["pluginify/pluginify"],
						ignore: ["basics/module/module"],
						out: function(){
							return __dirname+"/out/pluginify.js"
						},
						minify: false
					}
				}
			}
		}, [{}], {}, function(err){
			done(err);
		});
		
	});
	
});


})();
