export default class Powerup extends Phaser.Physics.Matter.Sprite {
    constructor(scene, config) {
        const {
            x, y,
            spriteKey,
            width = 16,
            height = 16,
            effect = () => {},
            soundKey
        } = config;

        super(scene.matter.world, x, y, spriteKey);
        this.scene = scene;
        this.scene.add.existing(this);

        this.setData('type', 'powerup');
        this.setData('effect', effect);
        this.setDepth(700);
        this.soundKey = soundKey;

        // Use a rectangle sensor body
        const body = Phaser.Physics.Matter.Matter.Bodies.rectangle(x, y, width, height, {
            isSensor: true,
            label: 'powerupSensor'
        });

        body.gameObject = this; // critical for collision detection

        this.setExistingBody(body);
        this.setPosition(x, y);
        this.setCollisionCategory(this.scene.categoryPowerup);
        this.setCollidesWith([this.scene.categoryHero]);
        this.setStatic(true); // doesn’t move

        this.collected = false;

        this.animKey = `${spriteKey}_animation`;
        if (!scene.anims.exists(this.animKey)) {
            scene.anims.createFromAseprite(spriteKey); // assumes .json contains the animation
        }
    }

    update(delta) {
        const deltaY = this.scene.scrollSpeed * (delta / 1000) * 0.75;
        this.y += deltaY;
        this.setY(this.y);

        this.anims.play(this.animKey, true)
        

        if (this.y > this.scene.sys.canvas.height + 50) {
            this.destroy();
        }
    }

    trigger(heroBody) {
        if (this.collected) return;
        this.collected = true;

        const effect = this.getData('effect');
        if (typeof effect === 'function') {
            effect(heroBody);
        }

        this.scene.soundObj[this.soundKey].play();

        // Optional: play animation/sound before destroying
        this.destroy();
    }
}
