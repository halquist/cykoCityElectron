export default class Ramp extends Phaser.Physics.Matter.Sprite {
    constructor(scene, config) {
        const { x, y, spriteKey = 'ramp', width = 32, height = 32, options = {} } = config;

        super(scene.matter.world, x, y, spriteKey);
        this.scene = scene;
        this.scene.add.existing(this);
        this.spriteKey = config.spriteKey;

        this.setData('type', 'ramp');

        // Create rectangle (sensor) and circle (physical) parts
        const Matter = Phaser.Physics.Matter.Matter;

        const rectSensor = Matter.Bodies.rectangle(
            0, +12,  // relative offset
            width - 20, height - 50,
            { isSensor: true, label: "rampSensor" }
        );
        
        const blockerCircle = Matter.Bodies.circle(
            0, -8,  // relative offset
            18,
            { isSensor: false, label: "rampBlocker" }
        );
        
        rectSensor.gameObject = this;
        blockerCircle.gameObject = this;
        
        const compoundBody = Matter.Body.create({
            parts: [rectSensor, blockerCircle],
            isStatic: true,
            label: "rampCompound"
        });
        
        // Apply final position after defining parts
        Matter.Body.setPosition(compoundBody, { x, y });
        
        this.setExistingBody(compoundBody);

        this.setExistingBody(compoundBody);
        this.setOrigin(0.5, 0.3);  // ensure sprite is centered
        this.setPosition(x, y);
        this.setCollisionCategory(this.scene.categoryObstacle);
        this.setCollidesWith([this.scene.categoryHero, this.scene.categoryEnemy]);
        this.setStatic(true);
        this.setFixedRotation();

        this.alreadyTriggered = false;
    }

    update(delta) {
        const deltaY = this.scene.scrollSpeed * (delta / 1000);
        this.y += deltaY;
        this.setY(this.y);

        const screenHeight = this.scene.sys.canvas.height;
        if (this.y > screenHeight + 50) {
            this.destroy();
        }
    }

    tryTriggerJump(heroBody) {
        if (this.alreadyTriggered) return;
        this.alreadyTriggered = true;

        if (heroBody.gameObject?.parentRef?.enterJumpState) {
            heroBody.gameObject.parentRef.enterJumpState();
        }
    }
}
