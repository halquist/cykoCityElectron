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
        this.load.aseprite("cykanic", "assets/menu/camp/cykanic.png", "assets/menu/camp/cykanic.json");
        this.load.aseprite("clinik", "assets/menu/camp/clinik.png", "assets/menu/camp/clinik.json");
        this.load.aseprite("street_corner", "assets/menu/camp/street_corner.png", "assets/menu/camp/street_corner.json");
        this.load.aseprite("black_market", "assets/menu/camp/black_market.png", "assets/menu/camp/black_market.json");
        this.load.json('base_state','assets/menu/camp/camp_config.json');
        this.load.aseprite("cursor", "assets/ui/target_cursor.png", "assets/ui/target_cursor.json");
    }

    create() {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'camp_bg')
          .setOrigin(0.5, 0.5);
      
        // Register all Aseprite animations up front
        ['gang_hang','cykanic','clinik','street_corner','black_market'].forEach(key => {
          if (!this.anims.exists(`${key}_anim`)) {
            this.anims.createFromAseprite(key);
          }
        });
      
        this.input.setTopOnly(true);
      
        this.events.on('open-structure-menu', ({ id, state }) => {
          this.scene.launch('StructureMenu', { id, state });
          this.scene.pause(); // modal
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
            this.add.existing(b);
        }

        this.cursor = new Cursor({
            scene: this,
            x: 0,
            y: 0,
            key: "cursor",
          })
    }

    update(time, delta) {
        this.cursor.update(delta);
    }
}
