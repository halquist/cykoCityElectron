// src/ui/components/TabBar.js
export class TabBar extends Phaser.GameObjects.Container {
    constructor(scene, x, y, tabs, opts={}) {
      super(scene, x, y);
      this.tabs = tabs;
      this.color = opts.color ?? 0x23ae6a;
      this.bgColor = opts.bgColor ?? 0x23ae6a;
      this.onTab = opts.onTab || (()=>{});
      this.buttons = [];
      this.activeKey = null;
  
      let offsetX = 0;
      tabs.forEach(t => {
        const w = 40, h = 6;
        const g = scene.add.graphics();
        g.fillStyle(this.bgColor, 1).fillRect(offsetX, 0, w, h);
        // g.lineStyle(1, this.color, 1).strokeRect(offsetX+0.5, 0.5, w-1, h-1);
  
        const txt = scene.add.text(offsetX + 9, -8, t.label, {
          fontFamily: 'pixelFont, monospace', 
          fontSize: '16px',
          color: '#23ae6a',
          resolution: 30,
        });
  
        const zone = scene.add.zone(offsetX, 0, w, h).setOrigin(0).setInteractive({ cursor:'pointer' });
        zone.on('pointerdown', () => this.onTab(t.key));
  
        this.add([g, txt, zone]);
        this.buttons.push({ key: t.key, g, txt, zone, w, h });
        offsetX += w + 6;
      });
    }
  
    setActive(key) {
      this.activeKey = key;
      for (const b of this.buttons) {
        const active = (b.key === key);
        b.g.clear();
        b.g.fillStyle(active ? 0x23ae6a : this.bgColor, 1)
          .fillRect(b.zone.x, b.zone.y, b.w, b.h)
          // .lineStyle(1, this.color, 1)
          // .strokeRect(b.zone.x+0.5, b.zone.y+0.5, b.w-1, b.h-1);
        b.txt.setColor(active ? '#000000' : '#23ae6a');
      }
    }
  }
  