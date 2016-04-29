(function (exports) {
    'use strict';

    const MONITOR_GRAPH_HEIGHT = 30;
    const MONITOR_GRAPH_WIDTH = 100;
    const MAX_SAMPLES = MONITOR_GRAPH_WIDTH;
    let container = null;
    let initialized = false;
    let frameTasks = [];
    let rafId = -1;
    /**
     * Initialize Performance Monitor
     */
    function initPerfMonitor(options) {
        if (!initialized) {
            if (options.container) {
                container = options.container;
            }
            initialized = true;
        }
    }
    /**
     * Check that everything is properly initialized
     */
    function checkInit() {
        if (!container) {
            container = document.createElement('div');
            container.style.cssText = 'position: fixed;' + 'opacity: 0.9;' + 'right: 0;' + 'bottom: 0';
            document.body.appendChild(container);
        }
        initialized = true;
    }
    /**
     * Schedule new task that will be executed on the next frame
     */
    function scheduleTask(task) {
        frameTasks.push(task);
        if (rafId === -1) {
            requestAnimationFrame(t => {
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
        constructor(min, max, mean, now) {
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
        constructor() {
            this.samples = [];
            this.maxSamples = MONITOR_GRAPH_WIDTH;
        }
        addSample(v) {
            if (this.samples.length === this.maxSamples) {
                this.samples.shift();
            }
            this.samples.push(v);
        }
        calc() {
            let min = this.samples[0];
            let max = this.samples[0];
            let sum = 0;
            for (let i = 0; i < this.samples.length; i++) {
                let k = this.samples[i];
                if (k < min) {
                    min = k;
                }
                if (k > max) {
                    max = k;
                }
                sum += k;
            }
            const now = this.samples[this.samples.length - 1];
            const mean = sum / this.samples.length;
            return new Result(min, max, mean, now);
        }
    }
    class MonitorWidget {
        constructor(name, unitName, flags = 0) {
            this._syncView = () => {
                const result = this.results[this.results.length - 1];
                const scale = MONITOR_GRAPH_HEIGHT / (result.max * 1.2);
                this.text.innerHTML = '' + ((this.flags & 1 /* HideMin */) === 0 ? `<div>min: &nbsp;${ result.mean.toFixed(2) }${ this.unitName }</div>` : '') + ((this.flags & 2 /* HideMax */) === 0 ? `<div>max: &nbsp;${ result.max.toFixed(2) }${ this.unitName }</div>` : '') + ((this.flags & 4 /* HideMean */) === 0 ? `<div>mean: ${ result.mean.toFixed(2) }${ this.unitName }</div>` : '') + ((this.flags & 8 /* HideNow */) === 0 ? `<div>now: &nbsp;${ result.now.toFixed(2) }${ this.unitName }</div>` : '');
                if ((this.flags & 16 /* HideGraph */) === 0) {
                    this.ctx.fillStyle = '#010';
                    this.ctx.fillRect(0, 0, MONITOR_GRAPH_WIDTH, MONITOR_GRAPH_HEIGHT);
                    this.ctx.fillStyle = '#0f0';
                    for (let i = 0; i < this.results.length; i++) {
                        this.ctx.fillRect(i, MONITOR_GRAPH_HEIGHT, 1, -(this.results[i].now * scale));
                    }
                }
                this._dirty = false;
            };
            this.name = name;
            this.unitName = unitName;
            this.flags = flags;
            this.results = [];
            this.element = document.createElement('div');
            this.element.style.cssText = 'padding: 2px;' + 'background-color: #020;' + 'font-family: monospace;' + 'font-size: 12px;' + 'color: #0f0';
            this.label = document.createElement('div');
            this.label.style.cssText = 'text-align: center';
            this.label.textContent = this.name;
            this.text = document.createElement('div');
            this.element.appendChild(this.label);
            this.element.appendChild(this.text);
            if ((flags & 16 /* HideGraph */) === 0) {
                this.canvas = document.createElement('canvas');
                this.canvas.style.cssText = 'display: block; padding: 0; margin: 0';
                this.canvas.width = MONITOR_GRAPH_WIDTH;
                this.canvas.height = MONITOR_GRAPH_HEIGHT;
                this.ctx = this.canvas.getContext('2d');
                this.element.appendChild(this.canvas);
            } else {
                this.canvas = null;
                this.ctx = null;
            }
            this._dirty = false;
        }
        addResult(result) {
            if (this.results.length === MONITOR_GRAPH_WIDTH) {
                this.results.shift();
            }
            this.results.push(result);
            this.invalidate();
        }
        invalidate() {
            if (!this._dirty) {
                this._dirty = true;
                scheduleTask(this._syncView);
            }
        }
    }
    /**
     * Start FPS monitor
     */
    function startFPSMonitor() {
        checkInit();
        const data = new Data();
        const w = new MonitorWidget('FPS', 'fps', 2 /* HideMax */ | 1 /* HideMin */ | 4 /* HideMean */);
        container.appendChild(w.element);
        const samples = [];
        let last = 0;
        function update(now) {
            const elapsed = (now - (last === 0 ? now : last)) / 1000;
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
    /**
     * Start Memory Monitor
     */
    function startMemMonitor() {
        checkInit();
        if (performance.memory !== void 0) {
            const data = new Data();
            const w = new MonitorWidget('Memory', 'MB', 1 /* HideMin */ | 4 /* HideMean */);
            container.appendChild(w.element);
            const mem = performance.memory;
            function update() {
                data.addSample(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
                w.addResult(data.calc());
                setTimeout(update, 30);
            }
            update();
        }
    }
    class Profiler {
        constructor(name, unitName) {
            this.data = new Data();
            this.widget = new MonitorWidget(name, unitName);
            this.startTime = 0;
        }
    }
    const profilerInstances = {};
    function startProfile(name) {
        const profiler = profilerInstances[name];
        if (profiler !== void 0) {
            profiler.startTime = performance.now();
        }
    }
    function endProfile(name) {
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
    function initProfiler(name) {
        checkInit();
        let profiler = profilerInstances[name];
        if (profiler === void 0) {
            profilerInstances[name] = profiler = new Profiler(name, 'ms');
            container.appendChild(profiler.widget.element);
        }
    }

    exports.initPerfMonitor = initPerfMonitor;
    exports.startFPSMonitor = startFPSMonitor;
    exports.startMemMonitor = startMemMonitor;
    exports.startProfile = startProfile;
    exports.endProfile = endProfile;
    exports.initProfiler = initProfiler;

}((this.perfMonitor = this.perfMonitor || {})));