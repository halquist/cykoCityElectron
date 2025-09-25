// src/ui/panels/LoadoutPanel.js
import Phaser from 'phaser';
import { gameState } from '../../../../src/state/gameState.js'; // adjust path

const GREEN        = 0x2DE36E;
const DARK_GREEN   = 0x1a8a49;
const BG_BLACK     = 0x00140b;
const TEXT_COLOR   = '#2DE36E';
const TEXT_SELECTED= '#00140b';

export default class LoadoutPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x:number,y:number,w:number,h:number}} bounds - content rect inside modal
   */
  constructor(scene, bounds) {
    this.scene = scene;
    this.bounds = bounds;

    // container the overlay will add to panelContainer
    this.display = scene.add.container(0,0);

    // --- STATE BRIDGE (example schema; adjust to your real gameState) ---
    // Available inventory
    const inv = gameState.playerInventory || {
      bikes:        [{id:'basic', name:'Basic Cyko'}, {id:'viper', name:'Viper'}],
      melee:        [{id:'sword', name:'Sword'}, {id:'chain', name:'Chain'}],
      ranged:       [{id:'handgun', name:'Handgun'}, {id:'smg', name:'SMG'}, {id:'particle', name:'Particle Cannon'}],
    };
    // Current selection for next mission
    const loadout = gameState.playerLoadout || {
      bike: 'basic',
      meleeIds: ['sword'],
      rangedIds: ['handgun'],
    };
    // Slot limits from abilities
    const abilities = gameState.abilities || {
      maxMeleeSlots: 1,
      maxRangedSlots: 1,
    };

    this.inv = inv;
    this.loadout = loadout;
    this.abilities = abilities;

    // --- LAYOUT ---
    const colGap = 14;
    const secW = Math.floor((bounds.w - colGap*2) / 3);
    const secH = bounds.h;

    const x1 = bounds.x;
    const x2 = bounds.x + secW + colGap;
    const x3 = bounds.x + (secW + colGap) * 2;
    const y  = bounds.y;

    // Section 1: Motorcyko (single select)
    this.bikeSection = this._makeSection(
      'Motorcyko',
      x1, y, secW, secH,
      this.inv.bikes,
      (item) => item.id === this.loadout.bike,
      (item) => this._selectBike(item.id),
      { multi: false }
    );

    // Section 2: Melee (multi up to maxMeleeSlots)
    this.meleeSection = this._makeSection(
      'Melee Weapons',
      x2, y, secW, secH,
      this.inv.melee,
      (item) => this.loadout.meleeIds.includes(item.id),
      (item) => this._toggleMelee(item.id),
      { multi: true, max: this.abilities.maxMeleeSlots }
    );

    // Section 3: Ranged (multi up to maxRangedSlots)
    this.rangedSection = this._makeSection(
      'Ranged Weapons',
      x3, y, secW, secH,
      this.inv.ranged,
      (item) => this.loadout.rangedIds.includes(item.id),
      (item) => this._toggleRanged(item.id),
      { multi: true, max: this.abilities.maxRangedSlots }
    );
  }

  // --- SECTION BUILDER ---

  _makeSection(title, x, y, w, h, items, isSelectedFn, onToggle, opts={}) {
    const cont = this.scene.add.container(0,0);
    this.display.add(cont);

    // Header
    const header = this.scene.add.text(x, y, title, {
      fontFamily: 'pixelFontV2, Calibri',
      fontSize: '16px',
      color: TEXT_COLOR,
      resolution: 30
    });
    cont.add(header);

    // List area
    const listY = y + 18;
    const itemHeight = 8;
    const pad = 4;

    items.forEach((item, idx) => {
      const iy = listY + idx * (itemHeight + 2);

      // background rect
      const bg = this.scene.add.rectangle(x, iy, w, itemHeight, BG_BLACK, 1)
        .setOrigin(0,0)
        .setStrokeStyle(1, 0x173d2a, 1)
        .setInteractive({ useHandCursor: true });

      // label
      const label = this.scene.add.text(x + pad, iy + 1, item.name, {
        fontFamily: 'pixelFontV2, Calibri',
        fontSize: '16px',
        color: TEXT_COLOR,
        resolution: 30
      });

      // add to section
      cont.add(bg);
      cont.add(label);

      // live style update based on selection/hover
      const applyState = (hover=false) => {
        const picked = isSelectedFn(item);
        if (hover) {
          // cursor highlight: black text on bright green bar
          bg.setFillStyle(GREEN, 1);
          label.setColor(TEXT_SELECTED);
        } else if (picked) {
          // chosen for use: darker green text on black
          bg.setFillStyle(BG_BLACK, 1);
          label.setColor('#1a8a49'); // darker green
        } else {
          // idle: green on black
          bg.setFillStyle(BG_BLACK, 1);
          label.setColor(TEXT_COLOR);
        }
      };

      applyState(false);

      bg.on('pointerover', () => applyState(true));
      bg.on('pointerout',  () => applyState(false));
      bg.on('pointerdown', () => {
        onToggle(item);
        applyState(true);
      });
      label.setInteractive({ useHandCursor: true })
        .on('pointerover', () => applyState(true))
        .on('pointerout',  () => applyState(false))
        .on('pointerdown', () => {
          onToggle(item);
          applyState(true);
        });
    });

    return cont;
  }

  // --- LOADOUT MUTATORS (and enforce limits) ---

  _selectBike(bikeId) {
    this.loadout.bike = bikeId;
    gameState.playerLoadout = { ...this.loadout };
    // refresh section visuals
    this._refresh();
  }

  _toggleMelee(id) {
    const list = this.loadout.meleeIds;
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i,1);
    else {
      if (list.length >= (this.abilities.maxMeleeSlots||1)) return; // enforce
      list.push(id);
    }
    gameState.playerLoadout = { ...this.loadout };
    this._refresh();
  }

  _toggleRanged(id) {
    const list = this.loadout.rangedIds;
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i,1);
    else {
      if (list.length >= (this.abilities.maxRangedSlots||1)) return; // enforce
      list.push(id);
    }
    gameState.playerLoadout = { ...this.loadout };
    this._refresh();
  }

  _refresh() {
    // simplest: destroy and rebuild this panel (small lists, cheap)
    this.display.removeAll(true);
    const {x,y,w,h} = this.bounds;
    const colGap = 14;
    const secW = Math.floor((w - colGap*2) / 3);
    const secH = h;

    const x1 = x;
    const x2 = x + secW + colGap;
    const x3 = x + (secW + colGap) * 2;

    this.bikeSection = this._makeSection('Motorcyko', x1, y, secW, secH,
      this.inv.bikes,
      (it)=>it.id === this.loadout.bike,
      (it)=>this._selectBike(it.id),
      { multi:false });

    this.meleeSection = this._makeSection('Melee Weapons', x2, y, secW, secH,
      this.inv.melee,
      (it)=>this.loadout.meleeIds.includes(it.id),
      (it)=>this._toggleMelee(it.id),
      { multi:true, max:this.abilities.maxMeleeSlots });

    this.rangedSection = this._makeSection('Ranged Weapons', x3, y, secW, secH,
      this.inv.ranged,
      (it)=>this.loadout.rangedIds.includes(it.id),
      (it)=>this._toggleRanged(it.id),
      { multi:true, max:this.abilities.maxRangedSlots });
  }

  destroy() {
    this.display?.destroy(true);
  }
}
