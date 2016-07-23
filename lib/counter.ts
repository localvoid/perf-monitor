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

class Timestamp {
  value: number;
  next: Timestamp | null;

  constructor(value: number) {
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
  private _firstTimestamp: Timestamp | null;
  private _lastTimestamp: Timestamp | null;

  constructor(interval: number) {
    this.interval = interval;
    this.value = 0;
    this.onChange = null;
    this._firstTimestamp = null;
    this._lastTimestamp = null;
  }

  inc() {
    const timestamp = new Timestamp(performance.now() + this.interval);
    if (this._firstTimestamp === null) {
      this._firstTimestamp = timestamp;
      setTimeout(this._dec, this.interval);
    } else {
      this._lastTimestamp!.next = timestamp;
    }
    this._lastTimestamp = timestamp;
    this.value++;
    this.onChange!();
  }

  _dec = () => {
    const now = performance.now();

    while (this._firstTimestamp !== null) {
      const nextTimestamp = this._firstTimestamp;
      if (now >= nextTimestamp.value) {
        this.value--;
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
