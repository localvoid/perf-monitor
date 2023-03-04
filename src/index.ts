const enum DefaultValues {
  EMAAlpha = 1 / 60,
}

/**
 * Exponential Moving Average.
 *
 * The EMA is a moving average that places a greater weight and significance on
 * the most recent data points.
 *
 * {@link https://www.investopedia.com/terms/e/ema.asp}
 */
export interface ExponentialMovingAverage {
  readonly alpha: number;
  avg: number;
  std: number;
  var: number;
  min: number;
}

const REGISTRY = new Map<string, ExponentialMovingAverage>();
(globalThis as any)[Symbol.for("perf-monitor")] = REGISTRY;

/**
 * Creates an exponential moving average bucket.
 *
 * @param alpha Should have a range (0,1).
 * @param name Unique name for a bucket.
 * @returns {@link ExponentialMovingAverage} bucket.
 */
export function ema(alpha: number = DefaultValues.EMAAlpha, name?: string): ExponentialMovingAverage {
  var s = {
    alpha,
    avg: NaN,
    std: 0.0,
    var: 0.0,
    min: 0.0,
  } satisfies ExponentialMovingAverage;
  if (name) {
    REGISTRY.set(name, s);
  }
  return s;
}

const isNaN = Number.isNaN;
const sqrt = Math.sqrt;

/**
 * Adds a sample to an exponential moving average bucket.
 *
 * @param bucket {@link ExponentialMovingAverage} bucket.
 * @param value sample.
 */
export const emaAdd = (bucket: ExponentialMovingAverage, value: number) => {
  if (isNaN(bucket.avg)) {
    bucket.avg = value;
    bucket.min = value;
    return;
  }
  var
    alpha = bucket.alpha,
    beta = 1 - alpha;

  bucket.var = beta * (bucket.var + (alpha * ((value - bucket.avg) ** 2)));
  bucket.avg = (beta * bucket.avg) + (alpha * value);
  bucket.std = sqrt(bucket.var);
  if (value < bucket.min) { bucket.min = value; }
};
