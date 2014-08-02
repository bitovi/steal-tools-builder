var stealTools = require("steal-tools");
var _ = require('lodash');
var	fs = require('fs-extra');
var path = require('path');

var mergeModules = function(items, modules){
	var i = 0,
		item;
	while(i < items.length) {
		item = items[i];
		if(typeof item === "object" && !(item instanceof RegExp) ) {
			var moduleNames = _.map( _.where(modules, item), "moduleName");
			items.splice.apply(items,[i,1].concat(moduleNames));
			i = i + moduleNames.length;
		} else {
			i++;
		}
	}
};

var addDefaults = function(name, obj, defaults){
	var parts = name.match(/ ([\w\+]+)$/);
	if(parts) {
		parts[1].replace(/\+(\w+)/g,function(whole, part){
			if(defaults[part]);
			_.assign(obj, defaults[part]);
		});
	}
};

module.exports = function(configuration, modules, defaults, cb){
	var configurations = _.map(configuration,function(config, name){
		
		config.outputs = _.map(config.outputs, function(output, name){
			
			addDefaults(name, output, defaults || {});
			// merge modules and graphs
			mergeModules(output.modules || [], modules);
			mergeModules(output.eachModule || [], modules);
			mergeModules(output.graphs || [], modules);
			mergeModules(output.ignore || [], modules);
			
			
			return {
				name: name,
				output: output
			};
		});
		
		return {
			configuration: config,
			name: name
		};
	});
	
	var modulesMap = _.indexBy(modules,"moduleName");

	var fileWrites = 0,
		errors = [],
		writeFile = function(filename, data){
			fileWrites++;
			fs.mkdirs(path.dirname(filename), function(err){
				if(err) {
					errors.push(err);
					fileWrites--;
					if(fileWrites === 0) {
						cb(errors.length ? errors: undefined);
					}
				} else {
					fs.writeFile(filename, data, function(err){
						if(err) {
							errors.push(err);
						}
						fileWrites--;
						if(fileWrites === 0) {
							cb(errors.length ? errors: undefined);
						}
					});
				}
			});
			
			
		};
	
	// gets the next configuration
	var nextConfiguration = function(){
		var config = configurations.shift(),
			pluginify,
			pluginifyAndWriteOut = function(moduleName, out, extraOptions){
				var result = pluginify(moduleName, _.assign(extraOptions||{},out.output) ),
					filePath;
				
				if(typeof out.output.out === "string") {
					filePath = out.output.out;
				} else {
					filePath = out.output.out(moduleName, modulesMap[moduleName]);
				}
				console.log(">  "+filePath);
				writeFile(filePath, result);
			};
		if(!config) {
			return;
		}
		
		console.log("CONFIGURATION "+config.name);
		
		var processOutput = function(out){
			console.log("OUTPUT "+out.name);
			
			if(out.output.eachModule) {
				var mods;
				if(Array.isArray( out.output.eachModule) ) {
					mods = out.output.eachModule;
				} else {
					mods = _.map( _.where(modules, out.output.eachModule), "moduleName");
				}
				mods.forEach(function(mod){
					pluginifyAndWriteOut(mod, out);
				});
			} else if(out.output.graphs){
				var mods = out.output.graphs;
				
				var ignores = stealTools.pluginifier.getAllIgnores(out.output.ignore, pluginify.graph);
				
				stealTools.graph.each(pluginify.graph, mods, function(name, node){
					if(!stealTools.pluginifier.matches(ignores, name)) {
						pluginifyAndWriteOut(name, out, {ignoreAllDependencies: true});
					}
				});
			} else {
				var mods;
				if(Array.isArray( out.output.modules) ) {
					mods = out.output.modules;
				} else if(out.output.modules){
					mods = _.map( _.where(modules, out.output.eachModules), "moduleName");
				}
				pluginifyAndWriteOut(mods, out);
			}
			
		};
		
		stealTools.pluginifier(config.configuration.graph.system, config.configuration.graph.options).then(function(configPluginify){
			pluginify = configPluginify;
			config.configuration.outputs.forEach(processOutput);
			
			nextConfiguration();
		})["catch"](function(e){
			cb(e);
		});
	};
	
	nextConfiguration();
};



