var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');
var tsConfig = require('./tsconfig.json');
var merge = require('merge2');

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('dist:cjs', function() {
  return gulp.src(['lib/**/*.ts'])
    .pipe(ts(Object.assign(tsConfig.compilerOptions, {
      target: 'es5',
      module: 'commonjs',
    })))
    .pipe(gulp.dest('dist/cjs'));
});

gulp.task('dist:es6', function() {
  var result = gulp.src(['lib/**/*.ts'])
    .pipe(ts(Object.assign(tsConfig.compilerOptions, {
      target: 'es6',
      module: undefined,
      declaration: true,
    })));

  return merge([
    result.dts.pipe(gulp.dest('dist/typings')),
    result.js.pipe(gulp.dest('dist/es6'))
  ]);
});

gulp.task('dist', ['dist:cjs', 'dist:es6']);
