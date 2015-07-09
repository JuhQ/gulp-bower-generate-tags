# gulp-bower-generate-tags

Generates `<script>` tags from bower.json config


## Install
`npm install gulp-bower-generate-tags --save-dev`


### Example usage

```
var gulp = require("gulp");
var bowerTags = require("gulp-bower-generate-tags");

gulp.task("default", function() {

  var options = {
    bowerDirectory: "example/bower_components",
    relativeBowerDirectory: "/bower_components", // this is what browser will see
    destinationFile: "example/dest/include-bower.html",
    priority: ['moment', 'angular'],
    overwrite: {
      angular: 'angular.min.js'
    }
  };

  return gulp.src("example/bower.json")
    .pipe(bowerTags(options));
});
```


### Options
`bowerDirectory`, path where your bower components are installed in the file system

`relativeBowerDirectory`, path where the components are available for the browser

`priority`, no javascript files are created equal, define load order here

`overwrite`, bower.json rarely contains the minified version, overwrite the main here