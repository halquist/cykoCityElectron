import Phaser from "phaser";
import Cursor from "../components/cursorClass.js"
import SoundtrackManager from "../utils/soundtrackManager.js";
import soundtrackList from "../../../public/assets/music/soundtrack.json";

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.image('menu_bg', 'assets/menu/main_splash_image_test.png');
        this.load.aseprite("cursor", "assets/ui/hand_cursor.png", "assets/ui/hand_cursor.json");
        this.game.soundtrackManager = new SoundtrackManager(this);
        this.game.soundtrackManager.loader(soundtrackList);
    }

    create() {
        this.anims.createFromAseprite('cursor');
        this.cursor = new Cursor({
            scene: this,
            x: 0,
            y: 0,
            key: "cursor",
            isMenuCursor: true
          })

        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'menu_bg')
        .setOrigin(0.5, 0.5)
        .setInteractive()
            .on('pointerdown', () => {
                this.cameras.main.fadeOut(200, 0, 0, 0);
                this.game.soundtrackManager.fadeOut();
                this.time.delayedCall(200, () => {
                    // stop camp and start the level
                    this.scene.start('GangCamp', { from: 'MainMenu' });
                });
            });

        this.game.soundtrackManager.create(soundtrackList);
        this.game.soundtrackManager.play({ shuffle: true, volume: 0.6 });
    }

    update(time, delta) {
        this.cursor.update(delta);
    }
}
