export default class Obstacle extends Phaser.Physics.Matter.Sprite {
    constructor(scene, config) {
        const {
            x, y,
            spriteKey,
            shape = 'rectangle',
            width = 32,
            height = 32,
            radius = 16,
            options = {},
            moveable = false,
            explosive = false,
            explosionRadius = 20,
            explosionDamage = 0,
            explosionKnockback = 0,
            explosionDelay = 0
        } = config;

        super(scene.matter.world, x, y, spriteKey);
        this.scene = scene;
        this.scene.add.existing(this);
        this.spriteKey = config.spriteKey;
        this.setData('type', 'obstacle');

        this.moveable = moveable;
        this.isExplosive = explosive;
        this.hasExploded = false;
        this.explosionRadius = explosionRadius;
        this.explosionDamage = explosionDamage;
        this.explosionKnockback = explosionKnockback;
        this.explosionDelay = explosionDelay;

        // Define body shape
        let body;
        switch (shape) {
            case 'circle':
                body = Phaser.Physics.Matter.Matter.Bodies.circle(x, y, radius, options);
                break;
            case 'rectangle':
            default:
                body = Phaser.Physics.Matter.Matter.Bodies.rectangle(x, y, width, height, options);
                break;
        }

        this.setExistingBody(body);
        this.setCollisionCategory(this.scene.categoryObstacle);
        this.setCollidesWith([this.scene.categoryHero, this.scene.categoryEnemy, this.scene.categoryObstacle, this.scene.categoryEnemySensor, this.scene.categoryHeroSensor]);
        this.setPosition(x, y);
        this.setFixedRotation();
        this.setMass(1000); 
        // this.setFriction(0.9);
        this.setFrictionAir(0.08);
        
        this.setStatic(!moveable); // only static if not moveable

        this.hasCollided = false;

        if (this.moveable || this.isExplosive ) {
            const animKey = `${spriteKey}_fallen`;
            if (!scene.anims.exists(animKey)) {
                scene.anims.createFromAseprite(spriteKey); // assumes .json contains the animation
            }
        }

        this.body.gameObject = this;
        this.body.gameObject.parentRef = this;
        this.parentRef = this;
    }

    triggerExplosion() {
        if (!this.isExplosive || this.hasExploded) return;
        this.hasExploded = true;
        this.setCollidesWith([]);
    
        // Play explosion animation if available
        if (this.anims && this.scene.anims.exists(`${this.spriteKey}_explode`)) {
            this.play(`${this.spriteKey}_explode`, true);
            this.on('animationcomplete', () => {
                this.play(`${this.spriteKey}_crater`, true);
            });
        } else {
            this.destroy();
        }
    
        this.scene.time.delayedCall(this.explosionDelay, () => {
            this.scene.soundObj.explosion1.play();
            // Create explosion sensor
            const sensor = this.scene.matter.add.circle(
                this.x,
                this.y,
                this.explosionRadius,
                {
                    isSensor: true,
                    isStatic: true,
                    label: 'explosionSensor',
                    collisionFilter: {
                        category: this.scene.categoryExplosion,
                        mask: this.scene.categoryHero | this.scene.categoryEnemy
                    }
                }
            );
    
            sensor.damage = this.explosionDamage;
            sensor.knockback = this.explosionKnockback;
        
            // Remove sensor after short delay
            this.scene.time.delayedCall(50, () => {
                this.scene.matter.world.remove(sensor);
            });
        })
    }

    update(delta) {
        const deltaY = this.scene.scrollSpeed * (delta / 1000);

        this.setDepth(this.y - 20);

        if (this.moveable) {
            // Translate dynamic body downward to mimic scroll
            Phaser.Physics.Matter.Matter.Body.translate(this.body, { x: 0, y: deltaY });
        } else {
            // Static obstacle, just adjust display y
            this.y += deltaY;
            this.setY(this.y);
        }

        const screenHeight = this.scene.sys.canvas.height;
        if (this.y > screenHeight * 2 || this.body?.position?.y > screenHeight * 2) {
            this.destroy();
        }
    }
}
