var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var connect = require('gulp-connect');
// var vulcanize = require('gulp-vulcanize');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var insert = require('gulp-insert');

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

// create the polymer script for the handlebars template to use
gulp.task('vulcanize', function() {
  return gulp.src('assets/polymer.html')
    .pipe(vulcanize({
      inlineScripts: true,
      stripComments: true
    }))
    // escape double {{ for handlebars
    .pipe(replace(/\(\\\\\[\\\\\[\|\{\{\)/, '(\\\\[\\\\[|\\\\{\\\\{)'))
    // remove html and body tags
    .pipe(replace(/<html>[\s\S]*?(<script>)/, '$1'))
    .pipe(replace('</body></html>', ''))
    // create the handlebars partial
    .pipe(rename(function(path) {
      path.extname = '.hbs';
      return path;
    }))
    .pipe(gulp.dest('template/partials'))
});

gulp.task('connect', function() {
  connect.server({
    livereload: true
  });
});

gulp.task('sass', function() {
  return gulp.src('assets/*.scss')
    .pipe(sass().on('error', sass.logError))
    // add style tag
    .pipe(insert.prepend('<style>\n'))
    .pipe(insert.append('\n</style>'))
    .pipe(rename(function(path) {
      path.extname = '.hbs';
      return path;
    }))
    .pipe(gulp.dest('template/partials'))
});

gulp.task('watch', function() {
  gulp.watch(src, ['lint']);
  gulp.watch('assets/polymer.html', ['vulcanize']);
  gulp.watch('assets/*.scss', ['sass']);
});

gulp.task('default', ['connect', 'sass', 'lint', 'test', 'watch']);