
steal-tools-builder
===================

Easily build and export a project into various formats.

## Options

### Configurations

```js
{
  CONFIGURATION_NAME: {
     // graph options are how the graph should be loaded
     "graph": {
       // options used by steal's System loader
       system: {},
       // options used to specify things like verbose
       options: {}
     },
     // what should be exported from this graph
     "outputs" : {
       OUTPUT_NAME: {
  
         // Writes out each module with its dependencies minus ignore.
         // Modules can be specified by name, or by an object comparitor
         modules: ["name", {core: true}]
         
         // writes out each module and its dependencies individually. Does not write out minus dependencies.
         graphs: [""],
         
         // regular expressions, functions that return true, strings.  These 
         // modules will not be written out or included in modules.
         ignores: [{core: true}, /can\/util/],
         
         // the output format: "steal","global","amd"
         format: ""
         
         // the name of the file to be written out.  It will be passed a module name
         out: function(moduleName){},
         
         // keeps dev tags
         keepDevelopmentCode: true,
         // minify the source code
         minify: true,
         
       }
     }
  }
}
```
