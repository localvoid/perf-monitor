import { MonitorMaxSamples, MonitorSamples } from "./samples";
import { Counter, BasicCounter, SlidingCounter } from "./counter";
import { MonitorWidget, MonitorWidgetFlags, CounterWidget } from "./widget";

export { MonitorWidgetFlags } from "./widget";

export interface MemoryPerformance {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory: MemoryPerformance;
  }
}

let container: HTMLElement | null = null;
let initialized = false;

/**
 * Performance Monitor Options.
 *
 * @param container all monitor widgets will be placed inside this container.
 */
export interface PerfMonitorOptions {
  container?: HTMLElement;
}

/**
 * Initialize Performance Monitor.
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
 * Check that everything is properly initialized.
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
 * Start FPS monitor
 */
export function startFPSMonitor(flags = MonitorWidgetFlags.HideMin | MonitorWidgetFlags.HideMax |
    MonitorWidgetFlags.HideMean | MonitorWidgetFlags.RoundValues): void {
  checkInit();

  const data = new MonitorSamples(MonitorMaxSamples);
  const w = new MonitorWidget(
    "FPS",
    flags,
    "",
    data);
  container!.appendChild(w.element);

  const alpha = 2 / 121;
  let last = 0;
  let fps = 60;

  function update(now: number) {
    if (last > 0) {
      fps += alpha * ((1000 / (now - last)) - fps);
    }
    last = now;
    data.addSample(fps);
    w.invalidate();
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/**
 * Start Memory Monitor
 */
export function startMemMonitor(flags = MonitorWidgetFlags.HideMin | MonitorWidgetFlags.HideMean): void {
  checkInit();
  if (performance.memory === undefined) {
    return;
  }

  const data = new MonitorSamples(MonitorMaxSamples);
  const w = new MonitorWidget("Memory", flags, "MB", data);
  container!.appendChild(w.element);

  function update() {
    data.addSample(Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)));
    w.invalidate();
    setTimeout(update, 30);
  }
  update();
}

class ProfilerDetails {
  data: MonitorSamples;
  widget: MonitorWidget;
  startTime: number;

  constructor(name: string, unitName: string, flags: number) {
    this.data = new MonitorSamples(MonitorMaxSamples);
    this.widget = new MonitorWidget(name, flags, unitName, this.data);
    this.startTime = -1;
  }
}

interface ProfilerDetailsMap {
  [key: string]: ProfilerDetails;
}

const profilerInstances: ProfilerDetailsMap = {};

class CounterDetails {
  data: Counter;
  widget: CounterWidget;

  constructor(name: string, interval?: number) {
    this.data = interval === undefined ? new BasicCounter() : new SlidingCounter(interval);
    this.widget = new CounterWidget(name, this.data);
    this.data.onChange = () => {
      this.widget.invalidate();
    };
  }
}

interface CounterDetailsMap {
  [key: string]: CounterDetails;
}

const counterInstances: CounterDetailsMap = {};

/**
 * Initialize profiler and insert into container.
 */
export function initProfiler(name: string, flags = 0): void {
  checkInit();

  let profiler = profilerInstances[name];
  if (profiler === void 0) {
    profilerInstances[name] = profiler = new ProfilerDetails(name, "ms", flags);
    container!.appendChild(profiler.widget.element);
  }
}

/**
 * Initialize counter and insert into container.
 */
export function initCounter(name: string, interval?: number): void {
  checkInit();

  let counter = counterInstances[name];
  if (counter === void 0) {
    counterInstances[name] = counter = new CounterDetails(name, interval);
    container!.appendChild(counter.widget.element);
  }
}

export function startProfile(name: string): void {
  const profiler = profilerInstances[name];
  if (profiler !== void 0) {
    profiler.startTime = performance.now();
  }
}

export function endProfile(name: string): void {
  const now = performance.now();
  const profiler = profilerInstances[name];
  if (profiler !== void 0 && profiler.startTime !== -1) {
    profiler.data.addSample(now - profiler.startTime);
    profiler.widget.invalidate();
  }
}

export function count(name: string, value = 1): void {
  const counter = counterInstances[name];
  if (counter !== void 0) {
    counter.data.inc(value);
  }
}
