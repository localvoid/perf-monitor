# Performance Monitor

## API

### `perf-monitor` module.

```ts
type Bucket = ExponentialMovingAverage;

/**
 * Exponential Moving Average.
 *
 * The EMA is a moving average that places a greater weight and significance on
 * the most recent data points.
 *
 * {@link https://www.investopedia.com/terms/e/ema.asp}
 */
interface ExponentialMovingAverage {
  readonly type: "ema";
  readonly alpha: number;
  avg: number;
  std: number;
  var: number;
  min: number;
}

// Creates an exponential moving average bucket.
function ema(alpha: number = 1 / 60): ExponentialMovingAverage;
// Adds a sample to an exponential moving average bucket.
function emaPush(ema: ExponentialMovingAverage, value: number): void;
```

### `perf-monitor/component`

```ts
class PerfMonitor extends HTMLElement {
  observe(name: string, bucket: Bucket): void;
}
```
#### `<perf-monitor>` Attributes

- `fps` - enables FPS monitor
- `mem` - enables Mem monitor [`performance.memory`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)

## Example

```html
<!doctype html>
<html>

<head>
  <title>perf-monitor example</title>
  <script src="https://cdn.jsdelivr.net/npm/perf-monitor@0.6.0/dist/component.js" type="module"></script>
  <script type="module">
    import {
      ema, emaPush,
    } from "https://cdn.jsdelivr.net/npm/perf-monitor@0.6.0/dist/index.js";

    const testEMA = ema();
    document.querySelector("perf-monitor").observe("test", testEMA);

    function tick() {
      let t0 = performance.now();
      for (let i = 0; i < 100000; i++) {
        Math.random();
      }
      emaPush(testEMA, performance.now() - t0);
      setTimeout(tick, 30);
    }
    tick();
  </script>
</head>

<body>
  <perf-monitor fps mem></perf-monitor>
</body>

</html>
```

## Enabling High-Resolution Timers with Better Precision

- https://developer.chrome.com/blog/cross-origin-isolated-hr-timers/
- https://web.dev/coop-coep/

Install HTTP server that supports custom headers, e.g. [serve](https://npmjs.com/package/serve).

```sh
npm -g install serve
```

Add COEP and COOP headers to `serve.json` config.

```json
{
  "headers": [
    {
      "source": "**/*.html",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

Start HTTP server.

```sh
serve
```
