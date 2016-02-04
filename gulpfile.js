var gulp = require('gulp');
var jshint = require('gulp-jshint');

var src = ['index.js', 'lib/**.js'];

gulp.task('lint', function() {
  return gulp.src(src)
    .pipe(jshint())
    .pipe(jshint.reporter( 'jshint-stylish' ))
});

gulp.task('watch', function() {
  gulp.watch(src, ['lint']);
});

gulp.task('default', ['lint', 'watch']);