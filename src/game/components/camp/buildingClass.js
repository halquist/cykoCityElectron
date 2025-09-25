// components/camp/buildingClass.js
export default class Building extends Phaser.GameObjects.Sprite {
    constructor(scene, id, def, state) {
      const levelIndex = Math.max(0, (state.level ?? 1) - 1);
      const skin = def.levels[levelIndex] ?? def.levels[0];
      const textureKey = skin.texture;
  
      // position from state
      super(scene, state.x, state.y, textureKey);
  
      this.id = id;
      this.def = def;
      this.state = state;

      this.displayName = def.displayName

      // Where to place the label relative to the sprite bottom-center
      this.labelOffset = def.labelOffset || { x: 0, y: -10 };

      this.setOrigin(def.originX ?? 0.5, def.originY ?? 1);
      this.setDepth(this.y);
  
      // interactive hit area
        // const hb = skin.hitbox;
        // if (hb) {
        // const ox = hb.ox ?? 0;
        // const oy = hb.oy ?? 0;

        // // top-left of hit rect in LOCAL coords (0,0 = top-left of texture)
        // const tx = -this.displayOriginX + ox;   // -width/2 + ox for originX=0.5
        // const ty = -this.displayOriginY + oy;   // -height   + oy for originY=1

        // const hitRect = new Phaser.Geom.Rectangle(tx, ty, hb.w, hb.h);
        // this.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
        // } else {
        this.setInteractive({ useHandCursor: true });
        // }

  
      // --- Hover label state ---
      this._hoverLabel = null;

      // --- Hover in: tint + loop anim + label ---
      this.on('pointerover', () => {
        this.def.onHover?.(this);

        const baseKey = `${textureKey}_anim`;
        if (scene.anims.get(baseKey)) {
          this.anims.play({ key: baseKey, repeat: -1 }, true);
        }

        // Create label if not present
        if (!this._hoverLabel) {
          const pos = this.getBottomCenter();
          this._hoverLabel = scene.add.text(
            pos.x + this.labelOffset.x,
            pos.y + this.labelOffset.y,
            this.displayName,
            {
              fontFamily: 'pixelFontV2, Calibri',
              fontSize: '16px',
              color: '#ef2064',
              stroke: '#000000',
              strokeThickness: 1,
              align: 'center',
              resolution: 30,
            }
          )
          .setOrigin(0.5, 0)   // centered under the sprite
          .setDepth(this.depth + 1)
          .setAlpha(0);

          scene.tweens.add({
            targets: this._hoverLabel,
            alpha: 1,
            duration: 120,
            ease: 'quad.out'
          });
        }
      });

      // --- Hover out: clear tint + stop anim + remove label ---
      this.on('pointerout', () => {
        this.def.onUnhover?.(this);

        const baseKey = `${textureKey}_anim`;
        const anim = scene.anims.get(baseKey);
        this.anims.stop();
        if (anim?.frames?.length) this.setFrame(anim.frames[0].frame.name);

        if (this._hoverLabel) {
          scene.tweens.add({
            targets: this._hoverLabel,
            alpha: 0,
            duration: 100,
            onComplete: () => {
              this._hoverLabel?.destroy();
              this._hoverLabel = null;
            }
          });
        }
      });
    
      this.on('pointerdown', () => {
        if (id === 'ramp_entrance') {
          this.scene.events.emit('start-level');
          return;
        }
      
        const sp = this.scene.scene;                       // ScenePlugin
        const currentKey = this.scene.sys.settings.key;    // e.g. 'GangCamp'
      
        // Pause the camp scene, then launch the modal
        sp.pause(currentKey);
        sp.launch('MenuOverlay', { menuKey: def.menu, menuTitle: def.menuTitle || def.name });
      
        // (Optional) tell others which structure opened it
        this.scene.events.emit('open-structure-menu', { id, state });
      });
    }
  }
  