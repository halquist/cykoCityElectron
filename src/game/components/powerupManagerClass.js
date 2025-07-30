import Powerup from './powerupClass.js';

export default class PowerupManager {
    constructor(scene, config) {
        this.scene = scene;
        this.spawnInterval = config.spawnInterval || 4000;
        this.spawnTimer = 0;

        this.minX = config.minX || 0;
        this.maxX = config.maxX || scene.sys.canvas.width;
        this.effectiveMinX = this.minX;
        this.effectiveMaxX = this.maxX;
        this.powerupTypes = config.powerupTypes || [];

        this.powerups = [];

        this.scene.matter.world.on('collisionstart', this.handleCollision.bind(this));
    }

    update(delta) {
        // Update current spawn bounds based on visible section
        const playerY = this.scene.hero?.y ?? this.scene.sys.canvas.height * 0.75;
        const section = this.scene.roadManager?.getSectionAtY(playerY);
        const sectionMinX = section?.minX;
        const sectionMaxX = section?.maxX;
    
        this.effectiveMinX = sectionMinX ?? this.minX;
        this.effectiveMaxX = sectionMaxX ?? this.maxX;
    
        this.spawnTimer += delta;
    
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnRandomPowerup();
        }
    
        this.powerups = this.powerups.filter(p => {
            if (!p.scene) return false;
            p.update(delta);
            return true;
        });
    }

    spawnRandomPowerup() {
        if (this.powerupTypes.length === 0) return;

        const type = Phaser.Utils.Array.GetRandom(this.powerupTypes);
        const x = Phaser.Math.Between(this.minX, this.maxX);
        const y = -30;

        const config = {
            x,
            y,
            spriteKey: type.spriteKey,
            width: type.width,
            height: type.height,
            effect: type.effect,
            soundKey: type.soundKey
        };

        const powerup = new Powerup(this.scene, config);
        this.powerups.push(powerup);
    }

    handleCollision(event) {
        for (const pair of event.pairs) {
            const a = pair.bodyA;
            const b = pair.bodyB;

            const powerup = [a, b].find(body => body.gameObject?.getData('type') === 'powerup');
            const hero = [a, b].find(body => body.gameObject?.parentRef?.type === 'hero');

            if (powerup && hero) {
                powerup.gameObject.trigger(hero);
            }
        }
    }

    getWeightedRandomType() {
        const totalWeight = this.obstacleTypes.reduce((sum, t) => sum + (t.spawnFrequency || 1), 0);
        let rand = Math.random() * totalWeight;
        for (const type of this.obstacleTypes) {
            rand -= (type.spawnFrequency || 1);
            if (rand <= 0) return type;
        }
        return this.obstacleTypes[0]; // fallback
    }
}
