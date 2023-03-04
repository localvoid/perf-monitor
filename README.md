# Performance Monitor

## API

```ts
interface ExponentialMovingAverage {
  readonly alpha: number;
  avg: number;
  std: number;
  var: number;
  min: number;
}

// Creates an exponential moving average bucket.
function ema(alpha: number = 1 / 60, name?: string): ExponentialMovingAverage;
// Adds a sample to an exponential moving average bucket.
function emaAdd(ema: ExponentialMovingAverage, value: number): void;
```

### `<perf-monitor>` Attributes

- `fps` - enables FPS monitor
- `mem` - enables Mem monitor [`performance.memory`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)

## Example

```html
<!doctype html>
<html>

<head>
  <title>perf-monitor example</title>
  <script src="https://cdn.jsdelivr.net/npm/perf-monitor@0.5.0/dist/component.js" type="module"></script>
  <script type="module">
    import {
      ema, emaAdd,
    } from "https://cdn.jsdelivr.net/npm/perf-monitor@0.5.0/dist/index.js";

    const testEMA = ema(1 / 60, "test");

    function tick() {
      let t0 = performance.now();
      for (let i = 0; i < 100000; i++) {
        Math.random();
      }
      emaAdd(testEMA, performance.now() - t0);
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
