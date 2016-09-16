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
  <script src="https://unpkg.com/perf-monitor@^0.3/dist/umd/perf-monitor.js"></script>
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

Npm package `perf-monitor` provides umd module, es6 module and TypeScript typings.

## API

#### `initPerfMonitor(options: PerfMonitorOptions)`

Initialize performance monitor. If perf monitor isn't initialized with this function, it will use default options.

Options:

 - `container: HTMLElement`

#### `startFPSMonitor(flags?: number)`

Add FPS monitor.

#### `startMemMonitor(flags?: number)`

Add Memory Monitor if browser has `window.performance.memory` object.

#### `initProfiler(name: string, flags = 0)`

Add code profiler monitor.

#### `initCounter(name: string, interval?: number)`

Add counter. Optional `interval` parameter sets sliding window interval.

#### `startProfile(name: string)`

Save start time of the profiled code.

#### `endProfile(name: string)`

Measure time between the start of the profiled code and the current time.

#### `count(name: string, value = 1)`

Increments counter.

#### `MonitorWidgetFlags`

```ts
enum MonitorWidgetFlags {
  HideMin     = 1,
  HideMax     = 1 << 1,
  HideMean    = 1 << 2,
  HideLast    = 1 << 3,
  HideGraph   = 1 << 4,
  RoundValues = 1 << 5,
}
```