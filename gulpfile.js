const gulp = require("gulp");
const del = require("del");
const typescript = require("typescript");
const tsConfig = require("./tsconfig.json");
const gulpTs = require("gulp-typescript");
const merge = require("merge2");
const rollup = require("rollup");

gulp.task("clean", del.bind(null, ["build", "dist"]));

gulp.task("build:es5", function () {
  return gulp.src(["lib/**/*.ts"])
    .pipe(gulpTs(Object.assign(tsConfig.compilerOptions, {
      typescript: typescript,
      target: "es5",
      module: "es6",
    })))
    .pipe(gulp.dest("build/es5"));

});

gulp.task("build:es6", function () {
  const result = gulp.src(["lib/**/*.ts"])
    .pipe(gulpTs(Object.assign(tsConfig.compilerOptions, {
      typescript: typescript,
      target: "es6",
      declaration: true,
    })));

  return merge([
    result.dts.pipe(gulp.dest("dist/typings")),
    result.js.pipe(gulp.dest("build/es6"))
  ]);
});

gulp.task("dist:umd", ["build:es5"], function () {
  return rollup.rollup({
    entry: "build/es5/perf-monitor.js",
  }).then((bundle) => bundle.write({
    format: "umd",
    moduleName: "perfMonitor",
    dest: "dist/umd/perf-monitor.js",
  }));
})

gulp.task("dist:es5", ["build:es5"], function () {
  return rollup.rollup({
    entry: "build/es5/perf-monitor.js",
  }).then((bundle) => bundle.write({
    format: "es",
    dest: "dist/es5/perf-monitor.js",
  }));
})

gulp.task("dist:es6", ["build:es6"], function () {
  return rollup.rollup({
    entry: "build/es6/perf-monitor.js",
  }).then((bundle) => bundle.write({
    format: "es",
    dest: "dist/es6/perf-monitor.js",
  }));
})

gulp.task("dist", ["dist:umd", "dist:es5", "dist:es6"]);
