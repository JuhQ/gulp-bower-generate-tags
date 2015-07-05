var gulp = require("gulp");
var bowerTags = require("./index.js");

gulp.task("default", function() {

  var options = {
    bowerDirectory: "example/bower_components",
    relativeBowerDirectory: "/bower_components", // this is what browser will see
    destinationFile: "example/dest/include-bower.html"
  };

  return gulp.src("example/bower.json")
    .pipe(bowerTags(options));
});