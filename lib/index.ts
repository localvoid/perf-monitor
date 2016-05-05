const MONITOR_GRAPH_HEIGHT = 30;
const MONITOR_GRAPH_WIDTH = 100;

let container: HTMLElement = null;
let initialized = false;
let frameTasks: Function[] = [];
let rafId = -1;

/**
 * Performance Monitor Options
 *
 * @param container all monitor widgets will be placed inside this container
 */
export interface PerfMonitorOptions {
  container?: HTMLElement;
}

/**
 * Initialize Performance Monitor
 */
export function initPerfMonitor(options: PerfMonitorOptions): void {
  if (!initialized) {
    if (options.container) {
      container = options.container;
    }

    initialized = true;
  }
}

/**
 * Monitor Flags
 */
const enum MonitorFlags {
  HideMin     = 1,
  HideMax     = 1 << 1,
  HideMean    = 1 << 2,
  HideNow     = 1 << 3,
  HideGraph   = 1 << 4,
  RoundValues = 1 << 5,
}

/**
 * Check that everything is properly initialized
 */
function checkInit(): void {
  if (!container) {
    container = document.createElement("div");
    container.style.cssText = "position: fixed;" +
                              "opacity: 0.9;" +
                              "right: 0;" +
                              "bottom: 0";
    document.body.appendChild(container);
  }
  initialized = true;
}

/**
 * Schedule new task that will be executed on the next frame
 */
function scheduleTask(task: Function): void {
  frameTasks.push(task);

  if (rafId === -1) {
    requestAnimationFrame((t) => {
      rafId = -1;
      let tasks = frameTasks;
      frameTasks = [];
      for (let i = 0; i < tasks.length; i++) {
        tasks[i]();
      }
    });
  }
}

class Result {
  min: number;
  max: number;
  mean: number;
  now: number;

  constructor(min: number, max: number, mean: number, now: number) {
    this.min = min;
    this.max = max;
    this.mean = mean;
    this.now = now;
  }
}

/**
 * Data object contains all data samples
 */
class Data {
  samples: number[];
  maxSamples: number;

  constructor() {
    this.samples = [];
    this.maxSamples = MONITOR_GRAPH_WIDTH;
  }

  addSample(v: number): void {
    if (this.samples.length === this.maxSamples) {
      this.samples.shift();
    }
    this.samples.push(v);
  }

  calc(): Result {
    let min = this.samples[0];
    let max = this.samples[0];
    let sum = 0;

    for (let i = 0; i < this.samples.length; i++) {
      let k = this.samples[i];
      if (k < min) { min = k; }
      if (k > max) { max = k; }
      sum += k;
    }
    const now = this.samples[this.samples.length - 1];
    const mean = sum / this.samples.length;

    return new Result(min, max, mean, now);
  }
}

class MonitorWidget {
  name: string;
  unitName: string;
  flags: number;
  results: Result[];
  element: HTMLDivElement;
  label: HTMLDivElement;
  text: HTMLDivElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private _dirty: boolean;

  constructor(name: string, unitName: string, flags = 0) {
    this.name = name;
    this.unitName = unitName;
    this.flags = flags;
    this.results = [];

    this.element = document.createElement("div");
    this.element.style.cssText = "padding: 2px;" +
                                 "background-color: #020;" +
                                 "font-family: monospace;" +
                                 "font-size: 12px;" +
                                 "color: #0f0";

    this.label = document.createElement("div");
    this.label.style.cssText = "text-align: center";
    this.label.textContent = this.name;
    this.text = document.createElement("div");

    this.element.appendChild(this.label);
    this.element.appendChild(this.text);

    if ((flags & MonitorFlags.HideGraph) === 0) {
      this.canvas = document.createElement("canvas");
      this.canvas.style.cssText = "display: block; padding: 0; margin: 0";
      this.canvas.width = MONITOR_GRAPH_WIDTH;
      this.canvas.height = MONITOR_GRAPH_HEIGHT;
      this.ctx = this.canvas.getContext("2d");
      this.element.appendChild(this.canvas);
    } else {
      this.canvas = null;
      this.ctx = null;
    }

    this._dirty = false;
  }

  addResult(result: Result): void {
    if (this.results.length === MONITOR_GRAPH_WIDTH) {
      this.results.shift();
    }
    this.results.push(result);
    this.invalidate();
  }

  invalidate(): void {
    if (!this._dirty) {
      this._dirty = true;
      scheduleTask(this._syncView);
    }
  }

  _syncView = () : void => {
    const result = this.results[this.results.length - 1];
    const scale = MONITOR_GRAPH_HEIGHT / (result.max * 1.2);

    const min = (this.flags & MonitorFlags.RoundValues) === 0 ? result.min.toFixed(2) : "" + Math.round(result.min);
    const max = (this.flags & MonitorFlags.RoundValues) === 0 ? result.max.toFixed(2) : "" + Math.round(result.max);
    const mean = (this.flags & MonitorFlags.RoundValues) === 0 ? result.mean.toFixed(2) : "" + Math.round(result.mean);
    const now = (this.flags & MonitorFlags.RoundValues) === 0 ? result.now.toFixed(2) : "" + Math.round(result.now);

    this.text.innerHTML = "" +
      ((this.flags & MonitorFlags.HideMin) === 0 ? `<div>min: &nbsp;${min}${this.unitName}</div>` : "") +
      ((this.flags & MonitorFlags.HideMax) === 0 ? `<div>max: &nbsp;${max}${this.unitName}</div>` : "") +
      ((this.flags & MonitorFlags.HideMean) === 0 ? `<div>mean: ${mean}${this.unitName}</div>` : "") +
      ((this.flags & MonitorFlags.HideNow) === 0 ? `<div>now: &nbsp;${now}${this.unitName}</div>` : "");

    if ((this.flags & MonitorFlags.HideGraph) === 0) {
      this.ctx.fillStyle = "#010";
      this.ctx.fillRect(0, 0, MONITOR_GRAPH_WIDTH, MONITOR_GRAPH_HEIGHT);

      this.ctx.fillStyle = "#0f0";
      for (let i = 0; i < this.results.length; i++) {
        this.ctx.fillRect(i, MONITOR_GRAPH_HEIGHT, 1, -(this.results[i].now * scale));
      }
    }
    this._dirty = false;
  }
}

/**
 * Start FPS monitor
 */
export function startFPSMonitor(): void {
  checkInit();

  const data = new Data();
  const w = new MonitorWidget("FPS", "",
    MonitorFlags.HideMax | MonitorFlags.HideMin | MonitorFlags.HideMean | MonitorFlags.RoundValues);
  container.appendChild(w.element);

  const samples: number[] = [];
  let last = 0;

  function update(now: number) {
    const elapsed = (now - ((last === 0) ? now : last)) / 1000;
    const fps = 1 / elapsed;
    if (fps !== Infinity) {
      if (samples.length === 64) {
        samples.shift();
      }
      samples.push(fps);

      let sum = 0;
      for (let i = 0; i < samples.length; i++) {
        sum += samples[i];
      }
      const mean = sum / samples.length;
      data.addSample(mean);
      w.addResult(data.calc());
    }
    last = now;
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

interface MemoryPerformance {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ChromePerformance {
  memory: MemoryPerformance;
}

/**
 * Start Memory Monitor
 */
export function startMemMonitor(): void {
  checkInit();

  if ((performance as any).memory !== void 0) {
    const data = new Data();
    const w = new MonitorWidget("Memory", "MB", MonitorFlags.HideMin | MonitorFlags.HideMean);
    container.appendChild(w.element);
    const mem = ((performance as any) as ChromePerformance).memory;

    function update() {
      data.addSample(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
      w.addResult(data.calc());
      setTimeout(update, 30);
    }
    update();
  }
}

class Profiler {
  data: Data;
  widget: MonitorWidget;
  startTime: number;

  constructor(name: string, unitName: string) {
    this.data = new Data();
    this.widget = new MonitorWidget(name, unitName);
    this.startTime = 0;
  }
}

interface ProfilerMap {
  [key: string]: Profiler;
}

const profilerInstances: ProfilerMap = {};

export function startProfile(name: string): void {
  const profiler = profilerInstances[name];
  if (profiler !== void 0) {
    profiler.startTime = performance.now();
  }
}

export function endProfile(name: string): void {
  const now = performance.now();
  const profiler = profilerInstances[name];
  if (profiler !== void 0) {
    profiler.data.addSample(now - profiler.startTime);
    profiler.widget.addResult(profiler.data.calc());
  }
}

/**
 * Initialize profiler and insert into container
 */
export function initProfiler(name: string): void {
  checkInit();

  let profiler = profilerInstances[name];
  if (profiler === void 0) {
    profilerInstances[name] = profiler = new Profiler(name, "ms");
    container.appendChild(profiler.widget.element);
  }
}
