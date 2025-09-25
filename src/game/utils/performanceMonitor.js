// Simple performance monitoring for debugging
export class PerformanceMonitor {
  constructor(scene) {
    this.scene = scene;
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 0;
    this.frameTime = 0;
    this.memoryUsage = 0;
    this.enabled = false;
    
    // Performance thresholds
    this.fpsThreshold = 45; // Warn if FPS drops below this
    this.frameTimeThreshold = 16.67; // Warn if frame time exceeds this (60fps)
    
    this.warnings = [];
  }

  enable() {
    this.enabled = true;
    this.lastTime = this.scene.time.now;
  }

  disable() {
    this.enabled = false;
  }

  update(time, delta) {
    if (!this.enabled) return;

    this.frameCount++;
    this.frameTime = delta;
    
    // Calculate FPS every 60 frames
    if (this.frameCount % 60 === 0) {
      const currentTime = time;
      const elapsed = currentTime - this.lastTime;
      this.fps = Math.round((60 * 1000) / elapsed);
      this.lastTime = currentTime;
      
      // Check for performance issues
      this.checkPerformance();
    }
  }

  checkPerformance() {
    if (this.fps < this.fpsThreshold) {
      this.warnings.push(`Low FPS: ${this.fps}`);
    }
    
    if (this.frameTime > this.frameTimeThreshold) {
      this.warnings.push(`High frame time: ${this.frameTime.toFixed(2)}ms`);
    }
    
    // Log warnings (limit to avoid spam)
    if (this.warnings.length > 0 && this.warnings.length % 10 === 0) {
      console.warn('Performance warnings:', this.warnings.slice(-5));
    }
  }

  getStats() {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      warnings: this.warnings.slice(-10), // Last 10 warnings
      enabled: this.enabled
    };
  }

  reset() {
    this.warnings = [];
    this.frameCount = 0;
  }
}
