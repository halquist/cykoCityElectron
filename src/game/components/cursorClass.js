export default class Cursor extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.scene.cameras.main.width / 2, config.scene.cameras.main.height / 2, config.key);

    this.scene = config.scene;
    this.key = config.key;

    this.setDepth(40000);
    this.setScrollFactor(0);
    this.scene.add.existing(this);

    this.x = this.scene.cameras.main.width / 2;
    this.y = this.scene.cameras.main.height / 2;

    // Starting position (center screen)

    this.speed = 350; // pixels per second at full stick deflection

    // Gamepad state
    // this. gamepad = this.scene.input.gamepad.getPad(0);

    this.gamepad = null;
    this.usingGamepad = false;

    this.scene.input.gamepad.once('connected', pad => {
        this.gamepad = pad;
        this.usingGamepad = true;
    });

    if (this.scene.input.gamepad.total > 0) {
        this.gamepad = this.scene.input.gamepad.getPad(0);
        this.usingGamepad = true;
    }

    this.cursorBounds = {
      xMin: 0,
      xMax: this.scene.cameras.main.width,
      yMin: 0,
      yMax: this.scene.cameras.main.height
    };
  }

  update(delta) {
    const dt = delta / 1000;
  
    if (this.usingGamepad && this.gamepad) {
      const stickX = this.gamepad.axes[2]?.getValue() || 0; // right stick horizontal
      const stickY = this.gamepad.axes[3]?.getValue() || 0; // right stick vertical
  
      const deadzone = 0.2;
      const moveX = Math.abs(stickX) > deadzone ? stickX : 0;
      const moveY = Math.abs(stickY) > deadzone ? stickY : 0;
  
      this.x += moveX * this.speed * dt;
      this.y += moveY * this.speed * dt;
  
      // Clamp to screen bounds
      this.x = Phaser.Math.Clamp(this.x, this.cursorBounds.xMin, this.cursorBounds.xMax);
      this.y = Phaser.Math.Clamp(this.y, this.cursorBounds.yMin, this.cursorBounds.yMax);
    } else {
      this.x = this.scene.input.activePointer.worldX;
      this.y = this.scene.input.activePointer.worldY;
    }
  }

  playAnimation(animKey) {
    if (!this.anims) return;
    if (!this.anims.isPlaying || this.anims.getName() !== animKey) {
      this.anims.play({ key: animKey });
    }
  }
}
