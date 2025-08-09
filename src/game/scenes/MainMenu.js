import Phaser from "phaser";
import Cursor from "../components/cursorClass.js"

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.image('menu_bg', 'assets/menu/main_splash_image_test.png');
        this.load.aseprite("cursor", "assets/ui/target_cursor.png", "assets/ui/target_cursor.json");
    }

    create() {
        this.anims.createFromAseprite('cursor');
        this.cursor = new Cursor({
            scene: this,
            x: 0,
            y: 0,
            key: "cursor",
          })

        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'menu_bg')
        .setOrigin(0.5, 0.5)
        .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('GangCamp');
            });
    }

    update(time, delta) {
        this.cursor.update(delta);
    }
}
