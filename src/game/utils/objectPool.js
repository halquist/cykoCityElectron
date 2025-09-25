// Simple object pool for frequently created/destroyed objects
export class ObjectPool {
  constructor(createFn, resetFn, maxSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.maxSize = maxSize;
  }

  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }

  release(obj) {
    if (this.pool.length < this.maxSize && obj) {
      this.resetFn(obj);
      this.pool.push(obj);
    } else if (obj && obj.destroy) {
      obj.destroy();
    }
  }

  clear() {
    this.pool.forEach(obj => {
      if (obj && obj.destroy) {
        obj.destroy();
      }
    });
    this.pool.length = 0;
  }
}

// Specific pools for common game objects
export class EffectPool {
  constructor(scene) {
    this.scene = scene;
    this.sparkPool = new ObjectPool(
      () => this.createSpark(),
      (spark) => this.resetSpark(spark),
      30
    );
    this.tracerPool = new ObjectPool(
      () => this.createTracer(),
      (tracer) => this.resetTracer(tracer),
      50
    );
  }

  createSpark() {
    const g = this.scene.add.graphics();
    return {
      graphics: g,
      vx: 0,
      vy: 0,
      alpha: 1,
      lifetime: 0,
      age: 0,
      color: 0x40afdd,
      active: false
    };
  }

  resetSpark(spark) {
    if (spark.graphics) {
      spark.graphics.clear();
      spark.graphics.setVisible(false);
      spark.graphics.setActive(false);
    }
    spark.vx = 0;
    spark.vy = 0;
    spark.alpha = 1;
    spark.lifetime = 0;
    spark.age = 0;
    spark.color = 0x40afdd;
    spark.active = false;
  }

  createTracer() {
    const g = this.scene.add.graphics();
    return {
      graphics: g,
      x: 0,
      y: 0,
      alpha: 1,
      active: false
    };
  }

  resetTracer(tracer) {
    if (tracer.graphics) {
      tracer.graphics.clear();
      tracer.graphics.setVisible(false);
      tracer.graphics.setActive(false);
    }
    tracer.x = 0;
    tracer.y = 0;
    tracer.alpha = 1;
    tracer.active = false;
  }

  getSpark() {
    const spark = this.sparkPool.get();
    spark.active = true;
    return spark;
  }

  releaseSpark(spark) {
    this.sparkPool.release(spark);
  }

  getTracer() {
    const tracer = this.tracerPool.get();
    tracer.active = true;
    return tracer;
  }

  releaseTracer(tracer) {
    this.tracerPool.release(tracer);
  }

  destroy() {
    this.sparkPool.clear();
    this.tracerPool.clear();
  }
}
