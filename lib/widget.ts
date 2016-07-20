import { scheduleNextFrameTask } from "./scheduler";
import { MonitorMaxSamples } from "./constants";
import { MonitorSamples } from "./samples";
import { Counter } from "./counter";

const MonitorGraphHeight = 30;
const MonitorGraphWidth = MonitorMaxSamples;

export abstract class Widget {
  readonly name: string;
  readonly element: HTMLDivElement;
  private _dirty: boolean;

  constructor(name: string) {
    this.name = name;
    this.element = document.createElement("div");
    this.element.style.cssText = "padding: 2px;" +
                                 "background-color: #020;" +
                                 "font-family: monospace;" +
                                 "font-size: 12px;" +
                                 "color: #0f0";

    this._dirty = false;
    this.invalidate();
  }

  invalidate(): void {
    if (!this._dirty) {
      this._dirty = true;
      scheduleNextFrameTask(this._sync);
    }
  }

  sync(): void {
    throw new Error("sync method not implemented");
  }

  _sync = () => {
    this.sync();
    this._dirty = false;
  }
}

export const enum MonitorWidgetFlags {
  HideMin     = 1,
  HideMax     = 1 << 1,
  HideMean    = 1 << 2,
  HideLast    = 1 << 3,
  HideGraph   = 1 << 4,
  RoundValues = 1 << 5,
}

export class MonitorWidget extends Widget {
  readonly name: string;
  readonly flags: number;
  readonly unitName: string;
  readonly samples: MonitorSamples;
  readonly minText: HTMLDivElement | null;
  readonly maxText: HTMLDivElement | null;
  readonly meanText: HTMLDivElement | null;
  readonly lastText: HTMLDivElement | null;
  readonly canvas: HTMLCanvasElement | null;
  readonly ctx: CanvasRenderingContext2D | null;

  constructor(name: string, flags: number, unitName: string, samples: MonitorSamples) {
    super(name);
    this.flags = flags;
    this.unitName = unitName;
    this.samples = samples;

    const label = document.createElement("div");
    label.style.cssText = "text-align: center";
    label.textContent = this.name;
    const text = document.createElement("div");
    if ((flags & MonitorWidgetFlags.HideMin) === 0) {
      this.minText = document.createElement("div");
      text.appendChild(this.minText);
    } else {
      this.minText = null;
    }
    if ((flags & MonitorWidgetFlags.HideMax) === 0) {
      this.maxText = document.createElement("div");
      text.appendChild(this.maxText);
    } else {
      this.maxText = null;
    }
    if ((flags & MonitorWidgetFlags.HideMean) === 0) {
      this.meanText = document.createElement("div");
      text.appendChild(this.meanText);
    } else {
      this.meanText = null;
    }
    if ((flags & MonitorWidgetFlags.HideLast) === 0) {
      this.lastText = document.createElement("div");
      text.appendChild(this.lastText);
    } else {
      this.lastText = null;
    }

    this.element.appendChild(label);
    this.element.appendChild(text);

    if ((flags & MonitorWidgetFlags.HideGraph) === 0) {
      this.canvas = document.createElement("canvas");
      this.canvas.style.cssText = "display: block; padding: 0; margin: 0";
      this.canvas.width = MonitorGraphWidth;
      this.canvas.height = MonitorGraphHeight;
      this.ctx = this.canvas.getContext("2d");
      this.element.appendChild(this.canvas);
    } else {
      this.canvas = null;
      this.ctx = null;
    }
  }

  sync() {
    const result = this.samples.calc();
    const scale = MonitorGraphHeight / (result.max * 1.2);

    let min: string;
    let max: string;
    let mean: string;
    let last: string;

    if ((this.flags & MonitorWidgetFlags.RoundValues) === 0) {
      min = result.min.toFixed(2);
      max = result.max.toFixed(2);
      mean = result.mean.toFixed(2);
      last = result.last.toFixed(2);
    } else {
      min = Math.round(result.min).toString();
      max = Math.round(result.max).toString();
      mean = Math.round(result.mean).toString();
      last = Math.round(result.last).toString();
    }

    if (this.minText !== null) {
      this.minText.textContent = `min: \u00A0${min}${this.unitName}`;
    }
    if (this.maxText !== null) {
      this.maxText.textContent = `max: \u00A0${max}${this.unitName}`;
    }
    if (this.meanText !== null) {
      this.meanText.textContent = `mean: ${mean}${this.unitName}`;
    }
    if (this.lastText !== null) {
      this.lastText.textContent = `last: ${last}${this.unitName}`;
    }

    if (this.ctx !== null) {
      this.ctx.fillStyle = "#010";
      this.ctx.fillRect(0, 0, MonitorGraphWidth, MonitorGraphHeight);

      this.ctx.fillStyle = "#0f0";
      this.samples.each((v, i) => {
        this.ctx!.fillRect(i, MonitorGraphHeight, 1, -(v * scale));
      });
    }
  }
}

export class CounterWidget extends Widget {
  readonly counter: Counter;
  readonly text: HTMLDivElement;

  constructor(name: string, counter: Counter) {
    super(name);
    this.counter = counter;
    this.text = document.createElement("div");
    this.element.appendChild(this.text);
  }

  sync() {
    this.text.textContent = `${this.name}: ${this.counter.value}`;
  }
}
