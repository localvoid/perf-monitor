let frameTasks: (() => void)[] = [];
let rafId = -1;

/**
 * Schedule new task that will be executed on the next frame.
 */
export function scheduleNextFrameTask(task: () => void): void {
  frameTasks.push(task);

  if (rafId === -1) {
    requestAnimationFrame(function(t) {
      rafId = -1;
      const tasks = frameTasks;
      frameTasks = [];
      for (let i = 0; i < tasks.length; i++) {
        tasks[i]();
      }
    });
  }
}
