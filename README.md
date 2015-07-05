# gulp-bower-generate-tags

Generates `<script>` tags from bower.json config


## Install
`npm install gulp-bower-generate-tags --save-dev`


### Example usage

```
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
```