import Phaser from "phaser";
import Building from "../components/camp/buildingClass.js";
import { STRUCTURES } from "../components/camp/structureRegistry.js";
import Cursor from "../components/cursorClass.js"

export default class GangCamp extends Phaser.Scene {
    constructor() {
        super({ key: 'GangCamp' });
    }

    preload() {
        this.load.image('camp_bg', 'assets/menu/camp/camp_background.png');
        
        this.load.aseprite("gang_hang", "assets/menu/camp/gang_hang.png", "assets/menu/camp/gang_hang.json");
        this.load.aseprite("crash_pad", "assets/menu/camp/crash_pad.png", "assets/menu/camp/crash_pad.json");
        this.load.aseprite("cykanic", "assets/menu/camp/cykanic.png", "assets/menu/camp/cykanic.json");
        this.load.aseprite("clinik", "assets/menu/camp/clinik.png", "assets/menu/camp/clinik.json");
        this.load.aseprite("street_corner", "assets/menu/camp/street_corner.png", "assets/menu/camp/street_corner.json");
        this.load.aseprite("black_market", "assets/menu/camp/black_market.png", "assets/menu/camp/black_market.json");
        this.load.aseprite("ramp_entrance", "assets/menu/camp/ramp_entrance.png", "assets/menu/camp/ramp_entrance.json");
        this.load.json('base_state','assets/menu/camp/camp_config.json');
        this.load.aseprite("hand_cursor", "assets/ui/hand_cursor.png", "assets/ui/hand_cursor.json");
    }

    create() {
        document.fonts.load('16px "pixelFontV2"');
        document.fonts.load('8px "titleFont"');
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'camp_bg')
          .setOrigin(0.5, 0.5)
          .setDepth(0);

        // // Hover label at top of screen
        // this.hoverLabel = this.add.text(this.scale.width / 2, 0, '', {
        //     fontFamily: "titleFont, sans-serif",
        //     fontSize: '8px',
        //     color: '#ffffff',
        //     stroke: '#000000',
        //     strokeThickness: 1,
        //     resolution: 30,
        //     align: 'center'
        // })
        // .setOrigin(0.5, 0) // center top
        // .setDepth(9999)
        // .setVisible(false);

        const WIDTH = 44;
        const HEIGHT = 144;
        // 2) Create a clickable zone (x, y, width, height)
        // const startHotspot = this.add.zone(WIDTH / 2, this.scale.height - HEIGHT / 2, WIDTH, HEIGHT)
        //     .setInteractive({ cursor: 'pointer' })
        //     .setScrollFactor(0); // stays fixed on screen

        // (optional) visual debug to see the box
        const DEBUG = false;
        if (DEBUG) {
            const g = this.add.graphics().lineStyle(1, 0x00ff00, 0.8);
            g.strokeRect(startHotspot.x - startHotspot.width/2, startHotspot.y - startHotspot.height/2, startHotspot.width, startHotspot.height);
            g.setDepth(9999);
        }

        // startHotspot.on('pointerup', () => {
        //     // optional: small feedback
        //     this.cameras.main.fadeOut(200, 0, 0, 0);
        //     this.game.soundtrackManager.fadeOut();
        //     this.time.delayedCall(200, () => {
        //         // stop camp and start the level
        //         this.scene.start('TestLevel', { from: 'GangCamp' });
        //     });
        // });
      
        // Register all Aseprite animations up front
        ['gang_hang','crash_pad','cykanic','clinik','street_corner','black_market','ramp_entrance'].forEach(key => {
          if (!this.anims.exists(`${key}_anim`)) {
            this.anims.createFromAseprite(key);
          }
        });
      
        this.input.setTopOnly(true);

        this.events.on('start-level', () => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.game.soundtrackManager.fadeOut();
            this.time.delayedCall(200, () => {
                // stop camp and start the level
                this.scene.start('TestLevel', { from: 'GangCamp' });
            });
        });
      
        // load state & spawn
        const state = this.cache.json.get('base_state');

        for (const [id, s] of Object.entries(state.structures)) {
            const def = STRUCTURES[id];
            if (!def) {
                console.warn(`No structure def for id "${id}" — check registry keys`);
                continue;
            }
            const levelIndex = Math.max(0, (s.level ?? 1) - 1);
            const skin = def.levels[levelIndex];
            if (!skin) {
                console.warn(`No level ${s.level} for "${id}"`);
                continue;
            }

            // Make sure animations for this texture exist
            if (!this.anims.exists(`${skin.texture}_anim`)) {
                this.anims.createFromAseprite(skin.texture);
            }

            const b = new Building(this, id, def, s); // s has x,y,level,locked
            // // hook hover text
            // b.on('pointerover', () => {
            //     this.hoverLabel.setText(def.displayName).setVisible(true);
            // });
            // b.on('pointerout', () => {
            //     this.hoverLabel.setVisible(false);
            // });
            this.add.existing(b);
        }

        this.cursor = new Cursor({
            scene: this,
            x: 0,
            y: 0,
            key: "hand_cursor",
            isMenuCursor: true
        })

        this.game.soundtrackManager.play({ shuffle: true, volume: 0.6, category: 'background' });
    }

    update(time, delta) {
        this.cursor.update(delta);
    }
}
