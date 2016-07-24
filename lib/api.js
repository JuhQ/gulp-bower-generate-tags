var fs = require('fs');
var path = require('path');

var api = {};

var getPluginPaths = function(json) {
  return json.dependencies;
};

var getPluginBowerConfig = function(plugin, options) {
  var bowerPath = path.join(options.bowerDirectory, '/', plugin, '/bower.json');
  var pluginBowerFile = fs.readFileSync(bowerPath);

  return JSON.parse(pluginBowerFile);
};

var isJavascriptFile = function(file) {
  return file.match(/\.js$/);
};

var findMainFromArray = function(json) {
  var result = json.filter(function(main) {
    return isJavascriptFile(main);
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

  if(typeof json.main === 'string') {
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

var getMainFile = function(json, options) {
  if(options.overwrite && options.overwrite[json.name]) {
    return options.overwrite[json.name];
  }

  if(typeof json.main === 'string') {
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
    .join('\n');
};

var createFilePath = function(options, plugin, file) {
  return path.join(options.relativeBowerDirectory, '/', plugin, '/', file);
};

var getFilePathAndDependecies = function(plugin, options) {
  var config = getPluginBowerConfig(plugin, options);

  if(!validateBowerFile(config)) {
    return false;
  }

  var mainFile = getMainFile(config, options);
  var filePath = createFilePath(options, plugin, mainFile);

  return {filePath: filePath, dependencies: getDependencies(config)};
};

var getFilePathForMissingJson = function(options, plugin) {
  return options.bowerJsonMissing && options.bowerJsonMissing[plugin];
};

api.createTags = function(content, options) {
  var bowerJson = JSON.parse(content.toString());
  var pluginPaths = getPluginPaths(bowerJson);

  var plugins = [];
  var dependencies = [];

  if(options.priority) {
    options.priority.forEach(function(priority) {
      plugins.push(priority);
    });
  }

  for(plugin in pluginPaths) {
    if(plugins.indexOf(plugin) === -1) {
      if(!options.skip || !options.skip[plugin] || getFilePathForMissingJson(options, plugin)) {
        plugins.push(plugin);
      }
    }
  }

  var files = plugins.map(function(plugin) {
    if(getFilePathForMissingJson(options, plugin)) {
      return createFilePath(options, plugin, getFilePathForMissingJson(options, plugin));
    }

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

api.writeFile = function(destinationFile, content, callback) {
  fs.writeFile(destinationFile, content, function(err) {
    if (err) {
      throw err;
    }

    callback.call();
  });
};


module.exports = api;
