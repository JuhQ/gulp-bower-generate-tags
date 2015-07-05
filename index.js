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

var getFilePaths = function(files, options) {
  for (var i = files.length - 1; i >= 0; i--) {
    files[i] = path.join(options.relativeBowerDirectory, "/", plugin, "/", files[i]);
  }

  return files;
};

var createScriptTags = function(files) {
  var tags = [];
  for (var i = files.length - 1; i >= 0; i--) {
    var file = files[i];
    var tag = '<script src="' + file + '"></script>';
    tags.push(tag);
  }
  return tags.join("\n");
};


var createTags = function(content, options) {
  var bowerJson = JSON.parse(content.toString());
  var pluginPaths = getPluginPaths(bowerJson);

  var files = [];
  for(plugin in pluginPaths) {

    var pluginBowerConfig = getPluginBowerConfig(plugin, options);

    if(typeof pluginBowerConfig.main !== "string") {
      continue;
    }

    if(!pluginBowerConfig.main.match(/\.js$/)) {
      continue;
    }

    files.push(pluginBowerConfig.main);
  }

  var filePaths = getFilePaths(files, options);
  var tags = createScriptTags(filePaths);

  return tags;
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

    console.log("options", options);

    fs.writeFile(options.destinationFile, file.contents, function (err) {
      if (err) {
        throw err;
      }
      console.log('It\'s saved!');
        cb(null, file);
    });

  });
};
