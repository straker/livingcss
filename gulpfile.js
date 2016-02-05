var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var src = ['index.js', 'lib/**.js', 'test/**/*.*'];

gulp.task('lint', function() {
  return gulp.src(src)
    .pipe(jshint())
    .pipe(jshint.reporter( 'jshint-stylish' ))
});

gulp.task('test', ['lint'], function(done) {
  return gulp.src('test/*.spec.js', {read: false})
    .pipe(mocha());
});

gulp.task('watch', function() {
  gulp.watch(src, ['lint']);
});

gulp.task('default', ['lint', 'test', 'watch']);