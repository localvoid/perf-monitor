/**
 * Counter interface.
 */
export interface Counter {
  value: number;
  inc(): void;
  onChange: (() => void) | null;
}

/**
 * Basic Counter.
 */
export class BasicCounter implements Counter {
  value: number;
  onChange: (() => void) | null;

  constructor() {
    this.value = 0;
    this.onChange = null;
  }

  inc() {
    this.value++;
    this.onChange!();
  }
}

/**
 * Sliding Counter counts how many times `inc` method were called during `interval` period.
 */
export class SlidingCounter implements Counter {
  readonly interval: number;
  value: number;
  onChange: (() => void) | null;
  private _timestamps: number[];

  constructor(interval: number) {
    this.interval = interval;
    this.value = 0;
    this.onChange = null;
    this._timestamps = [];
  }

  inc() {
    if (this.value === 0) {
      setTimeout(this._dec, this.interval);
    }
    this.value++;
    this._timestamps.push(performance.now() + this.interval);
    this.onChange!();
  }

  _dec = () => {
    const now = performance.now();

    while (this.value > 0) {
      const nextTimestamp = this._timestamps[0];
      if (now >= nextTimestamp) {
        this.value--;
        this._timestamps.shift();
      } else {
        setTimeout(this._dec, Math.ceil(nextTimestamp - now));
        break;
      }
    }

    this.onChange!();
  }
}
