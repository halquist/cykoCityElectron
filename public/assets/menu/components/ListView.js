// src/ui/components/ListView.js
export class ListView extends Phaser.GameObjects.Container {
    constructor(scene, x, y, w, h, opts={}) {
      super(scene, x, y);
      this.width = w; this.height = h;
      this.color = opts.color ?? 0x2DE36E;
      this.itemHeight = opts.itemHeight ?? 10;
      this.onSelect = opts.onSelect || (()=>{});
      this.items = [];
      this.index = -1;
  
      // frame
      const g = scene.add.graphics();
      g.lineStyle(1, this.color, 1).strokeRect(0.5, 0.5, w-1, h-1);
      this.add(g);
  
      // selection bar
      this.sel = scene.add.rectangle(1, 1, w-2, this.itemHeight-2, this.color, 1).setOrigin(0).setVisible(false);
      this.add(this.sel);
  
      // item text container
      this.texts = scene.add.container(0, 0);
      this.add(this.texts);
  
      // input
      this.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
      this.on('pointermove', (p) => {
        const localY = p.y - this.y;
        const i = Math.floor(localY / this.itemHeight);
        if (i >= 0 && i < this.items.length) this.setSelectedIndex(i);
      });
      this.on('pointerdown', () => this._fireSelect());
  
      // keys
      const k = scene.input.keyboard;
      this.upKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.downKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.confirmKey = k.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
  
    preUpdate() {
      if (Phaser.Input.Keyboard.JustDown(this.upKey))    this.setSelectedIndex(this.index - 1);
      if (Phaser.Input.Keyboard.JustDown(this.downKey))  this.setSelectedIndex(this.index + 1);
      if (Phaser.Input.Keyboard.JustDown(this.confirmKey)) this._fireSelect();
    }
  
    setItems(items) {
      this.items = items || [];
      this.texts.removeAll(true);
  
      this.items.forEach((item, i) => {
        const t = this.scene.add.text(8, i*this.itemHeight+2, item.label ?? String(item), {
          fontFamily: 'pixelFontV2, Calibri',
          fontSize: '16px',
          color: '#223ae6a',
          resolution: 30,
        });
        this.texts.add(t);
      });
  
      this.setSelectedIndex(this.items.length ? 0 : -1, true);
    }
  
    setSelectedIndex(i, silent=false) {
      i = Phaser.Math.Clamp(i, 0, this.items.length-1);
      if (i === this.index) return;
      this.index = i;
      const y = i * this.itemHeight + 1;
      this.sel.setY(y).setVisible(this.items.length > 0);
  
      // flip selected text to black-on-green
      this.texts.iterate((t, idx) => {
        t.setColor(idx === i ? '#000000' : '#23ae6a');
      });
  
      if (!silent) this._fireSelect();
    }
  
    _fireSelect() {
      if (this.index < 0) return;
      const item = this.items[this.index];
      this.onSelect(item);
    }
  }
  