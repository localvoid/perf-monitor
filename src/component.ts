import type { ExponentialMovingAverage } from "./index.js";

interface MemoryPerformance {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory: MemoryPerformance;
  }
}

const enum Const {
  KB = 1024,
  MB = KB * KB,
}

const corsIsolated = window.crossOriginIsolated;
const rAF = requestAnimationFrame;
const perf = performance;
const doc = document;
const REGISTRY_KEY = Symbol.for("perf-monitor");

interface Entry {
  readonly root: HTMLDivElement;
  readonly avg: Text;
  readonly std: Text;
  readonly min: Text;
}

export class PerfMonitor extends HTMLElement {
  readonly _root: ShadowRoot;
  readonly entries: Map<string, Entry>;
  container: HTMLDivElement | null;
  fpsText: Text | null;
  memTotalText: Text | null;
  memUsedText: Text | null;
  fps: number;
  tPrev: number;

  constructor() {
    super();

    const root = this._root = this.attachShadow({ mode: "closed" });
    root.innerHTML = `
<style>
:host {
  contain: content;
  position: fixed;
  top: 0;
  right: 0;
  display: block;
  min-width: 100px;
  opacity: 0.9;
  background: #000;
  color: #0f0;
  font: 10px monospace;
}
.common, .entries {
  display: block;
  padding: 5px;
  background: #111;
}
.common {
  margin: 0 0 1px 0;
}
.name {
  text-align: center;
}
</style>`;

    this.update = this.update.bind(this);
    this.entries = new Map();
    this.container = null;
    this.fpsText = null;
    this.memTotalText = null;
    this.memUsedText = null;
    this.fps = 60;
    this.tPrev = perf.now();

    const showFPS = this.getAttribute("fps") !== null;
    const showMem = this.getAttribute("mem") !== null && perf.memory;
    const common = doc.createElement("div");
    common.append(createField(`CORS Isolation: ${corsIsolated}`));
    if (showFPS || showMem) {
      common.className = "common";
      if (showFPS) {
        const fpsField = createField("FPS: ");
        common.appendChild(fpsField);
        this.fpsText = fpsField.lastChild as Text;
      }
      if (showMem) {
        const memTotalField = createField("Mem Total: ");
        const memUsedField = createField("Mem Used: ");
        common.append(memTotalField, memUsedField);
        this.memTotalText = memTotalField.lastChild as Text;
        this.memUsedText = memUsedField.lastChild as Text;
      }
    }
    root.appendChild(common);

    rAF(this.update);
  }

  update(now: number) {
    if (this.fpsText) {
      this.fps += (2 / 121) * ((1000 / (now - this.tPrev)) - this.fps);
      this.tPrev = now;
      this.fpsText.nodeValue = Math.round(this.fps).toString();
    }

    const mem = perf.memory;
    if (this.memTotalText) {
      this.memTotalText.nodeValue = (mem.totalJSHeapSize / Const.MB).toFixed(3);
    }
    if (this.memUsedText) {
      this.memUsedText.nodeValue = (mem.usedJSHeapSize / Const.MB).toFixed(3);
    }

    const registry: Map<string, ExponentialMovingAverage> = (globalThis as any)[REGISTRY_KEY];
    if (registry) {
      registry.forEach((stats, key) => {
        let entry = this.entries.get(key);
        if (!entry) {
          entry = createEntry(key);
          if (!this.container) {
            this.container = doc.createElement("div");
            this.container.className = "entries";
            this._root.appendChild(this.container);
          }
          this.container.appendChild(entry.root);
          this.entries.set(key, entry);
        }
        entry.avg.nodeValue = stats.avg.toFixed(4);
        entry.std.nodeValue = stats.std.toFixed(4);
        entry.min.nodeValue = stats.min.toFixed(4);
      });
    }

    rAF(this.update);
  }
}

customElements.define("perf-monitor", PerfMonitor);

function createField(label: string): Element {
  const e = doc.createElement("div");
  e.className = "field";
  e.append(label, "");
  return e;
}

function createEntry(label: string): Entry {
  const root = doc.createElement("div");
  const name = doc.createElement("div");
  const avgField = createField("avg: ");
  const stdField = createField("std: ");
  const minField = createField("min: ");
  name.className = "name";
  name.textContent = label;
  root.className = "entry";
  root.append(name, avgField, stdField, minField);

  return {
    root,
    avg: avgField.lastChild as Text,
    std: stdField.lastChild as Text,
    min: minField.lastChild as Text,
  } satisfies Entry;
}
