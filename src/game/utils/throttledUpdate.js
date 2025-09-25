// Throttled update system for non-critical updates
export class ThrottledUpdate {
  constructor(updateFn, interval = 100) {
    this.updateFn = updateFn;
    this.interval = interval;
    this.lastUpdate = 0;
    this.accumulatedDelta = 0;
  }

  update(time, delta) {
    this.accumulatedDelta += delta;
    
    if (time - this.lastUpdate >= this.interval) {
      this.updateFn(time, this.accumulatedDelta);
      this.lastUpdate = time;
      this.accumulatedDelta = 0;
    }
  }

  forceUpdate(time, delta) {
    this.updateFn(time, delta);
    this.lastUpdate = time;
    this.accumulatedDelta = 0;
  }
}

// Specific throttled updaters for common game systems
export class EffectThrottledUpdate extends ThrottledUpdate {
  constructor(updateFn, interval = 50) {
    super(updateFn, interval);
  }
}

export class UIThrottledUpdate extends ThrottledUpdate {
  constructor(updateFn, interval = 100) {
    super(updateFn, interval);
  }
}

export class AIThrottledUpdate extends ThrottledUpdate {
  constructor(updateFn, interval = 200) {
    super(updateFn, interval);
  }
}
