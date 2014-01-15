var _ = require('lodash');
var express = require('express');
var fs = require('fs');
var gulp = require('gulp');
var lr = require('tiny-lr');
var path = require('path')

var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var haml = require('gulp-haml');
var jasmine = require('gulp-jasmine');
var jshint = require('gulp-jshint');
var refresh = require('gulp-livereload');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var stylus = require('gulp-stylus');

var server = lr();
var config = _.extend({
  port: 8080,
  lrport: 35729,
  env: 'development'
}, gulp.env);
console.log(config);
var production = config.env === 'production';

gulp.task('lr-server', function () {
  server.listen(config.lrport, function (err) {
    if (err) {
      console.log(err);
    }
  });
});

gulp.task('js', function () {
  var commands =
    fs.readdirSync('src/js/lib/commands')
      .filter(function (f) {
        return f[0] != '.' && f.substr(-3) == '.js';
      }).map(function (f) {
        return 'require("' + './commands/' + f + '");';
      });

  fs.writeFileSync('src/js/lib/commands.js', commands.join('\n'));

  gulp.src('src/js/main.js')
    .pipe(jshint())
    .pipe(browserify({debug: true}))
    .pipe(gulpif(production, uglify()))
    .pipe(concat('all.js'))
    .pipe(gulp.dest('out/js'))
    .pipe(refresh(server));

});

// TODO: Compress images, html and css

gulp.task('css', function () {
  gulp.src('src/css/**/*.styl')
    .pipe(stylus())
    .pipe(concat('all.css'))
    .pipe(gulp.dest('out/css'))
    .pipe(refresh(server));
});

gulp.task('images', function () {
  gulp.src('src/images/**')
    .pipe(gulp.dest('out/images'))
    .pipe(refresh(server));
});

gulp.task('html', function () {
  gulp.src('src/**/*.haml')
    .pipe(haml())
    .pipe(gulp.dest('out'))
    .pipe(refresh(server));
});

gulp.task('start-server', function() {
  express()
    .use(express.static(path.resolve("./out")))
    .use(express.directory(path.resolve("./out")))
    .listen(config.port, function() {
      console.log("Listening on ", config.port);
    });
});


gulp.task('spec', function () {
  gulp.src('spec/**/*-spec.js')
    .pipe(jasmine());
});

gulp.task('build', ['js', 'css', 'images', 'html']);

gulp.task('server', ['build', 'lr-server', 'start-server'], function () {
  gulp.watch('src/js/**/*.js', function () {
    gulp.run('js');
  });

  gulp.watch('src/css/**/*.styl', function () {
    gulp.run('css');
  });

  gulp.watch('src/images/**', function () {
    gulp.run('images');
  });

  gulp.watch('src/**/*.haml', function () {
    gulp.run('html');
  });
});
