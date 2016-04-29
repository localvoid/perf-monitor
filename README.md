Performance monitor. Simple UI component that helps you measure performance.

## Getting Started

Install `perf-monitor` package.

```sh
npm install --save perf-monitor
```

Import dependencies and start profiling.

```js
import {initProfiler, startProfile, endProfiler} from 'perf-monitor';

// initProfile will create a new monitor component and inject it into your
// document.
initProfiler('a');
initProfiler('b');

function handleFrame() {
  // save start time of the profiled code
  startProfile('a');
  let a = 0;
  for (let i = 0; i < 100; i++) {
    a += Math.random();
  }
  // measure time between the start of the profiled code and the current time
  endProfile('a');

  startProfile('b');
  let b = 0;
  for (let i = 0; i < 100; i++) {
    b *= Math.random();
  }
  endProfile('b');

  console.log(a);
  console.log(b);
}

requestAnimationFrame(handleFrame);
```

## API

#### `initPerfMonitor(options: PerfMonitorOptions) => void`

Initialize performance monitor. If perf monitor isn't initialized with this
function, it will use default options.

Options:

 - `container: HTMLElement` set container

#### `startFPSMonitor() => void`

Add FPS monitor.

#### `startMemMonitor() => void`

Add Memory Monitor if browser supports `window.performance.memory`.

#### `initProfiler(name: string) => void`

Add new code profiler monitor.

### `startProfile(name: string) => void`

Save start time of the profiled code.

### `endProfile(name: string) => void`

Measure time between the start of the profiled code and the current time.
