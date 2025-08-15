export default class Cursor extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, 0, 0, config.key);

    this.scene = config.scene;
    this.key = config.key;
    this.isMenuCursor = !!config.isMenuCursor;

    // 👇 origin decides what part of the sprite is the cursor location
    this.setOrigin(this.isMenuCursor ? 0 : 0.5, this.isMenuCursor ? 0 : 0.5);

    this.setDepth(40000).setScrollFactor(0);
    this.scene.add.existing(this);

    // start centered
    const cam = this.scene.cameras.main;
    this.x = cam.width / 2;
    this.y = cam.height / 2;

    this.speed = 350;

    // optional menu anim keys
    this.idleAnim  = `${this.key}_idle`;
    this.clickAnim = `${this.key}_click`;

    // input state
    this.gamepad = null;
    this.usingGamepad = false;
    this.prevPadAPressed = false;
    this.prevMouseDown = false;
    this._hovered = null;

    // bounds in screen coords
    this.cursorBounds = { xMin: 0, xMax: cam.width, yMin: 0, yMax: cam.height };

    // gamepad hookup
    this.scene.input.gamepad.once('connected', pad => { this.gamepad = pad; this.usingGamepad = true; });
    if (this.scene.input.gamepad.total > 0) { this.gamepad = this.scene.input.gamepad.getPad(0); this.usingGamepad = true; }

    // resize -> keep clamped
    this.scene.scale.on('resize', (size) => {
      this.cursorBounds.xMax = size.width;
      this.cursorBounds.yMax = size.height;
      this.x = Phaser.Math.Clamp(this.x, this.cursorBounds.xMin, this.cursorBounds.xMax);
      this.y = Phaser.Math.Clamp(this.y, this.cursorBounds.yMin, this.cursorBounds.yMax);
    });

    // hide OS cursor
    this.scene.input.setDefaultCursor('none');

    if (this.isMenuCursor && this.scene.anims.exists(this.idleAnim)) {
      this.anims.play(this.idleAnim);
    }
  }

  update(delta) {
    const dt = delta / 1000;

    // --- move ---
    if (this.usingGamepad && this.gamepad) {
      const ax = this.gamepad.axes[2]?.getValue() || 0; // right stick
      const ay = this.gamepad.axes[3]?.getValue() || 0;
      const dead = 0.2;
      this.x += (Math.abs(ax) > dead ? ax : 0) * this.speed * dt;
      this.y += (Math.abs(ay) > dead ? ay : 0) * this.speed * dt;
    } else {
      this.x = this.scene.input.activePointer.worldX;
      this.y = this.scene.input.activePointer.worldY;
    }
    this.x = Phaser.Math.Clamp(this.x, this.cursorBounds.xMin, this.cursorBounds.xMax);
    this.y = Phaser.Math.Clamp(this.y, this.cursorBounds.yMin, this.cursorBounds.yMax);

    // --- hover detection (top-most interactive under cursor) ---
    const hoveredNow = this._pickTopAt(this.x, this.y);
    if (hoveredNow !== this._hovered) {
      if (this._hovered) this._emitPointerEvent(this._hovered, 'pointerout');
      if (hoveredNow)    this._emitPointerEvent(hoveredNow, 'pointerover');
      this._hovered = hoveredNow;
    }

    // --- click with A (or mouse as usual) ---
    const pointer = this.scene.input.activePointer;
    const mouseDown = !!pointer.isDown;
    const padAPressed = !!(this.gamepad?.buttons?.[0]?.pressed);

    // press
    if (!this.prevPadAPressed && padAPressed && this._hovered) {
      this._emitPointerEvent(this._hovered, 'pointerdown');
    }
    // release
    if (this.prevPadAPressed && !padAPressed && this._hovered) {
      this._emitPointerEvent(this._hovered, 'pointerup');
      this._emitPointerEvent(this._hovered, 'pointertap'); // optional, some UIs listen for tap/click
    }
    this.prevPadAPressed = padAPressed;

    // --- menu cursor anims ---
    if (this.isMenuCursor) {
      const pressed = mouseDown || padAPressed;
      if (pressed) {
        if (this.scene.anims.exists(this.clickAnim) && this.anims.getName() !== this.clickAnim) {
          this.anims.play(this.clickAnim, true);
        }
      } else if (this.scene.anims.exists(this.idleAnim) && this.anims.getName() !== this.idleAnim) {
        this.anims.play(this.idleAnim, true);
      }
    }

    this.prevMouseDown = mouseDown;
  }

  // Helper: ask Phaser who’s under (x,y)
  _pickTopAt(x, y) {
    const input = this.scene.input;
    const cam   = this.scene.cameras.main;
    const ptr   = input.activePointer;

    // stash
    const sx = ptr.x, sy = ptr.y, swx = ptr.worldX, swy = ptr.worldY;

    // set pointer to cursor position
    ptr.x = x; ptr.y = y;
    const wp = cam.getWorldPoint(x, y);
    ptr.worldX = wp.x; ptr.worldY = wp.y;

    // hit test via manager (camera-aware)
    const hits = input.manager.hitTest(ptr, this.scene.children.list, cam);

    // restore
    ptr.x = sx; ptr.y = sy; ptr.worldX = swx; ptr.worldY = swy;

    return (hits && hits.length) ? hits[0] : null;
  }

  // Emit pointer-style events to a GameObject
  _emitPointerEvent(target, type) {
    const pointer = this.scene.input.activePointer;
  
    // Compute local coords (safe on any GameObject)
    let localX = 0, localY = 0;
    if (target.getLocalPoint) {
      const out = new Phaser.Math.Vector2();
      target.getLocalPoint(this.x, this.y, out);
      localX = out.x; localY = out.y;
    }
  
    // Fire object-level event (what your on('pointerover'...) handlers receive)
    target.emit(type, pointer, localX, localY);
  
    // Also emit via the InputPlugin for any global listeners
    this.scene.input.emit(type, pointer, [target]);
  }
}
