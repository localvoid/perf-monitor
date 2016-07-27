/**
 * Counter interface.
 */
export interface Counter {
  value: number;
  inc(value: number): void;
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

  inc(value: number) {
    if (value > 0) {
      this.value += value;
      this.onChange!();
    }
  }
}

class TimestampedValue {
  timestamp: number;
  value: number;
  next: TimestampedValue | null;

  constructor(timestamp: number, value: number) {
    this.value = value;
    this.next = null;
  }
}

/**
 * Sliding Counter counts how many times `inc` method were called during `interval` period.
 */
export class SlidingCounter implements Counter {
  readonly interval: number;
  value: number;
  onChange: (() => void) | null;
  private _firstTimestamp: TimestampedValue | null;
  private _lastTimestamp: TimestampedValue | null;

  constructor(interval: number) {
    this.interval = interval;
    this.value = 0;
    this.onChange = null;
    this._firstTimestamp = null;
    this._lastTimestamp = null;
  }

  inc(value: number) {
    if (value > 0) {
      const timestamp = new TimestampedValue(performance.now() + this.interval, value);
      if (this._firstTimestamp === null) {
        this._firstTimestamp = timestamp;
        setTimeout(this._dec, this.interval);
      } else {
        this._lastTimestamp!.next = timestamp;
      }
      this._lastTimestamp = timestamp;
      this.value += value;
      this.onChange!();
    }
  }

  _dec = () => {
    const now = performance.now();

    while (this._firstTimestamp !== null) {
      const nextTimestamp = this._firstTimestamp;
      if (now >= nextTimestamp.value) {
        this.value -= nextTimestamp.value;
        this._firstTimestamp = this._firstTimestamp.next;
      } else {
        setTimeout(this._dec, Math.ceil(nextTimestamp.value - now));
        break;
      }
    }
    if (this._firstTimestamp === null) {
      this._lastTimestamp = null;
    }

    this.onChange!();
  }
}
