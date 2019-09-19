class Timer {
  private readonly name: 'setTimeout' | 'setInterval';
  private readonly timer: NodeJS.Timer;
  constructor(name: 'setTimeout' | 'setInterval', callback: (...args: any[]) => void, ms: number, ...args: any[]) {
    this.name = name;
    switch (name) {
      case 'setTimeout': this.timer = setTimeout(callback, ms, ...args); break;
      case 'setInterval': this.timer = setInterval(callback, ms, ...args); break;
    }
  }

  stop() {
    if (!this.timer) return;
    switch(this.name) {
      case 'setTimeout': clearTimeout(this.timer); break;
      case 'setInterval': clearInterval(this.timer); break;
    }
  }
}

export const timers = new Set<Timer>();

export function startTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]) {
  const timer = new Timer('setTimeout', callback, ms, ...args);
  timers.add(timer);
  return timer;
}

export function stopTimeout(timer: Timer) {
  timer.stop();
  if (timers.has(timer)) timers.delete(timer);
}

export function startInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]) {
  const timer = new Timer('setInterval', callback, ms, ...args);
  timers.add(timer);
  return timer;
}

export function stopInterval(timer: Timer) {
  timer.stop();
  if (timers.has(timer)) timers.delete(timer);
}

export function destroy() {
  for (const timer of timers.values()) {
    timer.stop();
    timers.delete(timer);
  }
}