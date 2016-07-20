export class MonitorSamplesResult {
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly last: number;

  constructor(min: number, max: number, mean: number, last: number) {
    this.min = min;
    this.max = max;
    this.mean = mean;
    this.last = last;
  }
}

/**
 * Profile Samples.
 */
export class MonitorSamples {
  readonly samples: number[];
  readonly maxSamples: number;
  private _i: number;

  constructor(maxSamples: number) {
    this.samples = [];
    this.maxSamples = maxSamples;
    this._i = -1;
  }

  addSample(v: number): void {
    this._i = (this._i + 1) % this.maxSamples;
    this.samples[this._i] = v;
  }

  each(fn: (v: number, i: number) => void): void {
    const samples = this.samples;
    for (let i = 0; i < samples.length; i++) {
      fn(samples[(this._i + 1 + i) % samples.length], i);
    }
  }

  calc(): MonitorSamplesResult {
    const samples = this.samples;
    if (samples.length === 0) {
      return new MonitorSamplesResult(0, 0, 0, 0);
    }

    let min = samples[(this._i + 1) % samples.length];
    let max = min;
    let sum = 0;

    for (let i = 0; i < samples.length; i++) {
      const k = samples[(this._i + 1 + i) % samples.length];
      if (k < min) { min = k; }
      if (k > max) { max = k; }
      sum += k;
    }
    const last = samples[this._i];
    const mean = sum / samples.length;

    return new MonitorSamplesResult(min, max, mean, last);
  }
}
