// Centralized game configuration for easy tuning
export const GameConfig = {
  physics: {
    fps: 60,
    positionIterations: 4,
    velocityIterations: 2,
    constraintIterations: 2,
    enableSleep: true,
    gravity: { x: 0, y: 0 }
  },
  
  performance: {
    maxEffects: 100,
    effectPoolSize: 50,
    uiUpdateInterval: 100,
    effectUpdateInterval: 50,
    enablePerformanceMonitoring: false
  },
  
  gameplay: {
    heroSpeed: 300,
    enemySpawnRate: 2000,
    maxEnemies: 2,
    obstacleSpawnRate: 800,
    scrollSpeed: 80,
    fastScrollSpeed: 120
  },
  
  rendering: {
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    smoothStep: true
  }
};

// Helper function to get config values with fallbacks
export function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let current = GameConfig;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
}

// Helper function to update config values
export function setConfig(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = GameConfig;
  
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}
