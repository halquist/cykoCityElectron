import GameObstacle from './obstacleClass.js'; // Your obstacle class
import rampClass from './rampClass.js'

export default class ObstacleManager {
    constructor(scene, config, roadManager) {
        this.scene = scene;
        this.roadManager = roadManager;

        this.obstacleTypes = config.obstacleTypes || []; // Array of { spriteKey, shape, width/height/radius }
        this.spawnInterval = config.spawnInterval || 1500; // milliseconds
        this.spawnTimer = 0;

        this.minX = config.minX || 0;
        this.maxX = config.maxX || scene.sys.canvas.width;

        this.obstacles = [];
    }

    update(delta) {
        this.spawnTimer += delta;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
    
            // Optional: check for current section-specific minX/maxX
            const playerY = this.scene.sys.canvas.height * 0.1;
            const section = this.scene.roadManager?.getSectionAtY(playerY);
            const sectionMinX = section?.minX;
            const sectionMaxX = section?.maxX;
    
            // Override spawn bounds if section defines them
            this.effectiveMinX = sectionMinX ?? this.minX;
            this.effectiveMaxX = sectionMaxX ?? this.maxX;
    
            this.spawnObstacle();
        }

        // Update and cull offscreen obstacles
        this.obstacles = this.obstacles.filter(ob => {
            if (!ob.scene) return false; // already destroyed
            ob.update(delta);
            return true;
        });
    }

    spawnObstacle() {
        const settings = this.roadManager.getCurrentObstacleSettings();
        if (!settings) return;
    
        const allowed = settings.allowedObstacles;
        const multiplier = settings.spawnRateMultiplier;
    
        // Apply multiplier by chance skipping this spawn
        if (Math.random() > multiplier) return;
    
        // Filter obstacle types to only allowed ones
        const allowedTypes = this.obstacleTypes.filter(o => allowed.includes(o.spriteKey));
        if (allowedTypes.length === 0) return;
    
        const type = this.getWeightedRandomType(allowedTypes);
        if (!type) return;
    
        const x = type.spriteKey === 'long_barrier'
            ? this.scene.width / 2
            : Phaser.Math.Between(this.effectiveMinX, this.effectiveMaxX);
        const y = -this.scene.height;
    
        const config = {
            x,
            y,
            spriteKey: type.spriteKey,
            shape: type.shape,
            width: type.width,
            height: type.height,
            radius: type.radius,
            moveable: type.moveable || false,
            explosive: type.explosive || false,
            explosionRadius: type.explosionRadius || null,
            explosionDamage: type.explosionDamage || 0,
            explosionKnockback: type.explosionKnockback || 0,
            explosionDelay: type.explosionDelay || 0
        };
    
        if (type.spriteKey === 'ramp') {
            this.spawnRamp(config);
        } else {
            const obstacle = new GameObstacle(this.scene, config);
            this.obstacles.push(obstacle);
        }
    }
    

    spawnRamp(config) {
        const ramp = new rampClass(this.scene, config);
        this.obstacles.push(ramp);
    }

    getWeightedRandomType(validTypes = this.obstacleTypes) {
        validTypes = validTypes.filter(type => {
            if (!type.maxCount) return true;
            const currentCount = this.obstacles.filter(o => o.spriteKey === type.spriteKey).length;
            return currentCount < type.maxCount;
        });
    
        if (validTypes.length === 0) return null;
    
        const totalWeight = validTypes.reduce((sum, t) => sum + (t.spawnFrequency || 1), 0);
        let rand = Math.random() * totalWeight;
        for (const type of validTypes) {
            rand -= (type.spawnFrequency || 1);
            if (rand <= 0) return type;
        }
        return validTypes[0];
    }
}
