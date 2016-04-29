var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');
var tsConfig = require('./tsconfig.json');
var merge = require('merge2');
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var ghPages = require('gulp-gh-pages');

gulp.task('clean', del.bind(null, ['dist', 'public']));

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

gulp.task('dist:public', ['dist:es6'], function() {
  return rollup.rollup({
    entry: 'dist/es6/index.js',
    plugins: [babel()]
  }).then(function(bundle) {
    return bundle.write({
      format: 'iife',
      dest: 'public/0.1/perf-monitor.js',
      moduleName: 'perfMonitor',
    });
  });
});

gulp.task('dist', ['dist:cjs', 'dist:es6', 'dist:public']);

gulp.task('deploy', ['dist:public'], function () {
  return gulp.src('public/**/*')
    .pipe(ghPages());
});
