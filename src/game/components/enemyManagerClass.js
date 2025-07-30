import enemyClass from './enemyClass.js'; // Your base enemy class

export default class EnemyManager {
    constructor(scene, config) {
        this.scene = scene;

        this.enemyConfigs = config.enemyConfigs || []; // Array of enemy config objects
        this.spawnInterval = config.spawnInterval || 1500; // milliseconds
        this.spawnTimer = 0;

        this.minX = config.minX || 0;
        this.maxX = config.maxX || scene.sys.canvas.width;

        this.target = config.target; // e.g., heroBike reference
        this.enemies = [];
        this.maxEnemies = config.maxEnemies;
    }

    update(time, delta) {
        // Update and cull dead enemies first
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy || enemy.isDestroyed) return false;
            enemy.update(time, delta);
            return true;
        });

        // Only increment spawn timer and spawn if under maxEnemies
        if (this.enemies.length < this.maxEnemies) {
            this.spawnTimer += delta;

            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
        } else {
            // If max enemies reached, pause the spawn timer
            this.spawnTimer = 0;
        }
    }

    spawnEnemy() {
        if (this.enemyConfigs.length === 0) return;

        const baseConfig = this.getWeightedRandomConfig();
        const x = Phaser.Math.Between(this.minX, this.maxX);
        const spawnTop = Math.random() < 0.5;
        const y = spawnTop ? -20 : this.scene.sys.canvas.height + 20;

        const config = {
            ...baseConfig,
            x,
            y,
            target: this.target
        };

        const enemy = new enemyClass(this.scene, config);
        this.enemies.push(enemy);
    }

    getWeightedRandomConfig() {
        const totalWeight = this.enemyConfigs.reduce((sum, cfg) => sum + (cfg.spawnFrequency || 1), 0);
        let rand = Math.random() * totalWeight;
        for (const cfg of this.enemyConfigs) {
            rand -= (cfg.spawnFrequency || 1);
            if (rand <= 0) return cfg;
        }
        return this.enemyConfigs[0]; // fallback
    }
}
