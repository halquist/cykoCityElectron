// src/ui/MenuOverlay.js
import Phaser from 'phaser';
import { gameState } from '../../../src/state/gameState.js';
// import { gameState } from 'src/state/gameState.js';
import { events } from '../../../src/state/events.js';
import { TabBar } from './components/TabBar.js';
import { ListView } from './components/ListView.js';
import Cursor from '../../../src/game/components/cursorClass.js';

// registry of submenu panels (filled later)
const PANEL_MAP = {
  // 'gang': () => new GangPanel(this, contentRect),
  // 'cykanic': () => new CykanicPanel(this, contentRect),
  // ...
};

export default class MenuOverlay extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuOverlay' });
  }

  init(data) {
    // which top-level menu to show first
    this.menuKey = data?.menuKey || 'gang';
    this.menuTitle = data?.menuTitle || 'MENU';
    // optional: pause underlying scene was done by caller
  }

  preload() {
    // load any assets needed for the menu overlay
    this.load.image('structure_menu', 'assets/menu/structure_menu.png');
  }

  create() {

    this.cursor = new Cursor({
        scene: this,
        x: 0,
        y: 0,
        key: "cursor",
        isMenuCursor: true
    })
    const { width: W, height: H } = this.scale;

    // --- BACKDROP ---
    // full screen dimmer
    this.add.rectangle(0, 0, W, H, 0x000000, 0.4).setOrigin(0);

    // --- MODAL IMAGE ---
    const modalImage = this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'structure_menu'
    ).setOrigin(0.5, 0.5).setDepth(0);

    // --- DERIVED POSITION & SIZE ---
    const modalX = modalImage.x - modalImage.displayWidth / 2;   // top-left X
    const modalY = modalImage.y - modalImage.displayHeight / 2;  // top-left Y
    const modalW = modalImage.displayWidth;                      // width
    const modalH = modalImage.displayHeight;                     // height

    // --- TITLE ---
    this.titleText = this.add.text(modalX + 8, modalY - 4, this.menuTitle, {
      fontFamily: 'pixelFont, monospace',
      fontSize: '16px',
      color: '#23ae6a',
      resolution: 30,
    }).setDepth(2);

    // --- TABS BAR ---
    const tabs = [
      { key: 'gang',     label: 'Gang' },
      { key: 'cykanic',  label: 'Cykanic' },
      { key: 'dealer',   label: 'Deala' },
      { key: 'market',   label: 'Black Market' },
      { key: 'clinik',   label: 'Clinik' },
    ];

    this.tabBar = new TabBar(this, modalX + 4, modalY + 14, tabs, {
      onTab: (key) => this.switchPanel(key),
      color: 0x2DE36E,
      bgColor: 0x001c0e
    });
    this.add.existing(this.tabBar);

    // --- CONTENT AREA (list left / detail right) ---
    const content = {
      x: modalX + 8,
      y: modalY + 50,
      w: modalW - 16,
      h: modalH - 58
    };
    // Optional grid lines for dev
    // g.lineStyle(1, 0x173d2a, 1).strokeRect(content.x, content.y, content.w, content.h);

    // left column list container (green on black)
    this.list = new ListView(this, content.x, content.y, Math.floor(content.w * 0.38), content.h, {
      color: 0x2DE36E,
      itemHeight: 18,
      onSelect: (item) => this.currentPanel?.onListSelect?.(item),
    });
    this.add.existing(this.list);

    // right column for details (picture/stats/cost text, etc.)
    this.detailContainer = this.add.container(content.x + this.list.width + 8, content.y);
    this.detailBounds = { w: content.w - this.list.width - 8, h: content.h };

    // close on ESC / B (pad)
    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.gamepad?.once('down', (pad, button) => {
      if (button?.index === 1 /* B */) this.close();
    });

    // --- CLOSE ZONE (top-right of modal image) ---
    const closeZoneWidth = 14; // pixels, adjust as needed
    const closeZoneHeight = 9;
    const closeZone = this.add.zone(
        modalX + modalW - closeZoneWidth - 7, // top-right X
        modalY + 3,                          // top-right Y
        closeZoneWidth,
        closeZoneHeight
    )
    .setOrigin(0, 0) // origin at top-left of zone
    .setInteractive({ cursor: 'pointer' })
    .setDepth(5);

    closeZone.on('pointerdown', () => {
      this.close();
    });

    // listen for external close/apply
    this.events.on('shutdown', () => events.off('menu:close', this.close, this));
    events.on('menu:close', this.close, this);

    // go to initial tab/panel
    this.switchPanel(this.menuKey);
  }

  switchPanel(key) {
    if (this.currentPanel) {
      this.currentPanel.destroy();
      this.currentPanel = null;
    }
    this.tabBar.setActive(key);

    // Create the panel (stub if not implemented yet)
    const makePanel = PANEL_MAP[key] || (() => new BasePanelStub(this, this.detailContainer, this.detailBounds));
    this.currentPanel = makePanel.call(this);

    // Ask panel for list items to show in the left column
    const items = this.currentPanel.getListItems ? this.currentPanel.getListItems() : [];
    this.list.setItems(items);
    // Optional auto-select first item
    if (items.length) this.list.setSelectedIndex(0, true);
  }

  close = () => {
    // fade out sfx/music if needed before closing (optional hook)
    this.scene.stop();        // close the overlay
    this.scene.resume('GangCamp'); // or whichever scene opened it
  }


  update(time, delta) {
    this.cursor.update(delta);
  }
}

// minimal stub so the shell works now
class BasePanelStub {
  constructor(scene, detailContainer, bounds) {
    this.scene = scene;
    this.detail = detailContainer;
    this.bounds = bounds;

    // placeholder text
    this.label = scene.add.text(0, 0, 'Panel under construction…', {
      fontFamily: 'pixelFont, monospace',
      fontSize: '16px',
      color: '#23ae6a',
      resolution: 30,
      wordWrap: { width: bounds.w }
    });
    this.detail.add(this.label);
  }
  getListItems() { return []; }
  onListSelect(item) {}
  destroy() { this.label?.destroy(); this.detail.removeAll(true); }
}
