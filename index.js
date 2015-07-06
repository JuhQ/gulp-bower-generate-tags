// through2 is a thin wrapper around node transform streams
var through = require('through2');
var gutil = require('gulp-util');

var fs = require("fs")
var path = require("path")


var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-bower-generate-tags';

var getPluginPaths = function(json) {
  return json.dependencies;
};

var getPluginBowerConfig = function(plugin, options) {
  var bowerPath = path.join(options.bowerDirectory, "/", plugin, "/bower.json");
  var pluginBowerFile = fs.readFileSync(bowerPath);

  return JSON.parse(pluginBowerFile);
};

var isJavascriptFile = function(file) {
  return file.match(/\.js$/);
};

var findMainFromArray = function(json) {
  var result = json.filter(function(dd) {
    return isJavascriptFile(dd);
  });

  return result[0];
};

var validateBowerFile = function(json) {
  if(!json) {
    return false;
  }

  if(!json.main) {
    return false;
  }

  if(typeof json.main === "string") {
    if(!isJavascriptFile(json.main)) {
      return false;
    }
  } else if(Array.isArray(json.main)) {
    return !!findMainFromArray(json.main);
  } else {
    return false;
  }

  return true;
};

var getMainFile = function(json) {
  if(typeof json.main === "string") {
    return json.main;
  }
  if(Array.isArray(json.main)) {
    return findMainFromArray(json.main);
  }

  return false;
};

var getDependencies = function(json) {
  return json.dependencies;
};

var createScriptTags = function(files) {
  return files
    .filter(function(file) {
      return file;
    })
    .map(function(file) {
      return '<script src="' + file + '"></script>';
    })
    .join("\n");
};

var getFilePathAndDependecies = function(plugin, options) {
  var config = getPluginBowerConfig(plugin, options);

  if(!validateBowerFile(config)) {
    return false;
  }

  var mainFile = getMainFile(config);
  var filePath = path.join(options.relativeBowerDirectory, "/", plugin, "/", mainFile);

  return {filePath: filePath, dependencies: getDependencies(config)};
};

var createTags = function(content, options) {
  var bowerJson = JSON.parse(content.toString());
  var pluginPaths = getPluginPaths(bowerJson);

  var plugins = [];
  var dependencies = [];
  for(plugin in pluginPaths) {
    plugins.push(plugin);
  }

  var files = plugins.map(function(plugin) {
    var pluginData = getFilePathAndDependecies(plugin, options);
    if(!pluginData) {
      return false;
    }

    if(pluginData.dependencies) {
      for(dependency in pluginData.dependencies) {
        // Dependency not yet included, include it now
        if(plugins.indexOf(dependency) === -1) {
          dependencies.push(dependency);
        }
      }
    }

    return pluginData.filePath;
  });

  for (var i = dependencies.length - 1; i >= 0; i--) {
    var pluginData = getFilePathAndDependecies(dependencies[i], options);
    if(!pluginData) {
      return false;
    }

    files.push(pluginData.filePath);
  }

  return createScriptTags(files);
};

// Plugin level function(dealing with files)
module.exports = function(options) {

  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }

    if (file.isBuffer()) {
      file.contents = new Buffer(createTags(file.contents, options));
    }
    if (file.isStream()) {
      file.contents = file.contents.pipe(createTags(file.contents, options));
    }

    fs.writeFile(options.destinationFile, file.contents, function (err) {
      if (err) {
        throw err;
      }

      cb(null, file);
    });

  });
};
