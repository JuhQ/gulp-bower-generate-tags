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

var validateBowerFile = function(json) {
  if(!json) {
    return false;
  }

  if(!json.main || typeof json.main !== "string") {
    return false;
  }

  if(!json.main.match(/\.js$/)) {
    return false;
  }
  return true;
};

var createScriptTags = function(files) {
  return files.map(function(file) {
    return '<script src="' + file + '"></script>';
  });
};

var createTags = function(content, options) {
  var bowerJson = JSON.parse(content.toString());
  var pluginPaths = getPluginPaths(bowerJson);

  var files = [];
  for(plugin in pluginPaths) {

    var pluginBowerConfig = getPluginBowerConfig(plugin, options);

    if(!validateBowerFile(pluginBowerConfig)) {
      continue;
    }

    var filePath = path.join(options.relativeBowerDirectory, "/", plugin, "/", pluginBowerConfig.main);

    files.push(filePath);
  }

  var tags = createScriptTags(files);

  return tags.join("\n");
}

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
