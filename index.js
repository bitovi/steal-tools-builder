var stealTools = require("steal-tools");
var fs = require('fs');
var _ = require('lodash');


var mergeModules = function(items, modules){
	var i = 0,
		item;
	while(i < items.length) {
		item = items[i];
		if(typeof item === "object" && !(item instanceof RegExp) ) {
			var moduleNames = _.map( _.where(modules, item), "moduleName");
			items.splice.apply(items,[i,0].concat(moduleNames));
			i = i + moduleNames.length;
		} else {
			i++;
		}
	}
};

module.exports = function(configuration, modules, defaults, cb){
	var configurations = _.map(configuration,function(config, name){
		
		config.outputs = _.map(config.outputs, function(output, name){
			// merge modules and graphs
			mergeModules(output.modules || [], modules);
			mergeModules(output.graphs || [], modules);
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
			fs.writeFile(filename, data, function(err){
				if(err) {
					errors.push(err);
				}
				fileWrites--;
				if(fileWrites === 0) {
					cb(errors.length ? errors: undefined);
				}
			});
		};
	
	// gets the next configuration
	var nextConfiguration = function(){
		var config = configurations.shift(),
			pluginify;
		if(!config) {
			return;
		}
		
		console.log("LOADING "+config.name);
		
		var processOutput = function(out){
			console.log("OUTPUT "+out.name);
			if(out.output.modules) {
				var mods;
				if(Array.isArray( out.output.modules) ) {
					mods = out.output.modules;
				} else {
					mods = _.map( _.where(modules, out.output.modules), "name");
				}
				mods.forEach(function(mod){
					var result = pluginify(mod, out.output);
					var filePath = out.output.out(mod, modulesMap[mod]);
					writeFile(filePath, result);
				});
			} else {
				var mods = out.output.graphs;
				mods.forEach(function(mod){
					stealTools.graph.each(pluginify.graph, function(name, node){
						var result = pluginify(name, _.assign({ignoreAllDependencies: true},out.output) );
						var filePath = out.output.out(mod, modulesMap[mod]);
						writeFile(filePath, result);
					});
				});
				
			}
			
			var result = pluginify(out.output.modules, out.output);
		};
		
		stealTools.pluginifier(config.configuration.graph.system, config.configuration.graph.options).then(function(configPluginify){
			pluginify = configPluginify;
			config.configuration.outputs.forEach(processOutput);
		},function(e){
			cb(e);
		});
	};
	
	nextConfiguration();
};
