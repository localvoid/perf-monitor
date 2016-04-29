Performance monitor. Simple UI component that helps you measure performance.
[Demo](http://localvoid.github.io/kivi-dbmonster/)

## Example

```html
<!doctype html>
<html>
<head>
  <title>perf monitor example</title>
</head>
<body>
  <script src="http://localvoid.github.io/perf-monitor/0.1/perf-monitor.js"></script>
  <script>
    // initProfiler will create a new monitor component and inject it into your
    // document.
    perfMonitor.initProfiler('a');
    perfMonitor.initProfiler('b');

    function tick() {
      // save start time of the profiled code
      perfMonitor.startProfile('a');
      let a = Math.random();
      for (let i = 0; i < 100; i++) {
        a += Math.random();
      }
      // measure time between the start of the profiled code and the current time
      perfMonitor.endProfile('a');

      perfMonitor.startProfile('b');
      let b = Math.random();
      for (let i = 0; i < 100; i++) {
        b *= Math.random();
      }
      perfMonitor.endProfile('b');

      console.log(a);
      console.log(b);

      setTimeout(tick, 30);
    }

    setTimeout(tick, 30);
  </script>
</body>
</html>
```

## NPM Package

Npm package `perf-monitor` provides standard commonjs module, es6 modules at
`jsnext:main` and TypeScript typings.

## API

#### `initPerfMonitor(options: PerfMonitorOptions) : void`

Initialize performance monitor. If perf monitor isn't initialized with this
function, it will use default options.

Options:

 - `container: HTMLElement` set container

#### `startFPSMonitor() : void`

Add FPS monitor.

#### `startMemMonitor() : void`

Add Memory Monitor if browser supports `window.performance.memory`.

#### `initProfiler(name: string) : void`

Add new code profiler monitor.

#### `startProfile(name: string) : void`

Save start time of the profiled code.

#### `endProfile(name: string) : void`

Measure time between the start of the profiled code and the current time.
