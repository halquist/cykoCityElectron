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

  
      this.on('pointerover', () => {
        def.onHover?.(this);
        const baseKey = `${textureKey}_anim`;
        if (scene.anims.get(baseKey)) {
          this.anims.play({ key: baseKey, repeat: -1 }, true); // loop while hovered
        }
      });
      
      this.on('pointerout', () => {
        def.onUnhover?.(this);
        const baseKey = `${textureKey}_anim`;
        const anim = scene.anims.get(baseKey);
        this.anims.stop();
        if (anim?.frames?.length) this.setFrame(anim.frames[0].frame.name);
      });
  
      this.on('pointerdown', () => {
        scene.events.emit('open-structure-menu', { id, state });
      });
    }
  }
  