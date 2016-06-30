// through2 is a thin wrapper around node transform streams
var through = require('through2');
var gutil = require('gulp-util');

var api = require('./lib/api');

var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-bower-generate-tags';

// Plugin level function(dealing with files)
module.exports = function(options) {

  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, callback) {
    if (file.isNull()) {
      // return empty file
      return callback(null, file);
    }

    if (file.isBuffer()) {
      file.contents = new Buffer(api.createTags(file.contents, options));
    }
    if (file.isStream()) {
      file.contents = file.contents.pipe(api.createTags(file.contents, options));
    }

    api.writeFile(options.destinationFile, file.contents, function() {
      callback(null, file);
    });

  });
};
