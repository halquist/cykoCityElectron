import Phaser from "phaser";
import uiLoader, { uiCreator, uiUpdate } from "../utils/uiLoader.js";
import { inputSetup, inputCheck } from "../utils/inputSetup.js";
import soundLoader, { soundCreator } from "../utils/soundLoader.js";
import SoundtrackManager from "../utils/soundtrackManager.js";
import soundtrackList from "../../../public/assets/music/soundtrack.json";
import heroClass from "../components/heroClass.js";
import enemyClass from "../components/enemyClass.js"
import ObstacleManager from "../components/obstacleManagerClass.js";
import createCollisionListeners from "../utils/collisions.js";
import { imageLoader, imageCreator } from "../utils/images.js";
import PowerupManager from "../components/powerupManagerClass.js";
import EnemyManager from "../components/enemyManagerClass.js";
import RoadManager from "../components/roadManager.js";
import { readFileSync } from 'fs';
// import Projectile from "../components/projectileClass.js";

const width = 320;
const height = 180;

class CykoCityTest extends Phaser.Scene {
    constructor() {
        super({ key: 'CykoCityTest', physics: { matter: { gravity: { y: 0 } } } });
        this.width = width;
        this.height = height;
    }

    preload() {

        imageLoader(this);
        

        uiLoader(this);
        this.soundtrackManager = new SoundtrackManager(this);
        this.soundtrackManager.loader(soundtrackList);

        soundLoader(this);
        this.textures.get('key').setFilter(Phaser.Textures.FilterMode.NEAREST);

        this.load.json('hero_config','assets/hero_bike/hero_config.json');
    }

    create() {
        document.fonts.load('16px "pixelFont"');

        // this.sound.context.resume();

        this.soundtrackManager.create(soundtrackList);
        this.soundtrackManager.play({ shuffle: true, volume: 0.6 });

        this.soundObj = {};

        imageCreator(this);
        soundCreator(this, this.soundObj);

        this.baseScrollSpeed = 80;
        this.scrollSpeed = this.baseScrollSpeed; // Adjust for desired speed
        this.displayScrollSpeed = this.baseScrollSpeed;

        this.activeMeleeSensors = new Map(); // sensorBody -> attacker instance

        this.categoryHero = 0x0001;
        this.categoryEnemy = 0x0002;
        this.categoryPowerup = 0x0003;
        this.categoryObstacle = 0x0004;
        this.categoryEnemySensor = 0x0005;
        this.categoryHeroSensor = 0x0006;
        this.categoryProjectile = 0x0007;
        this.categoryWorldBounds = 0x0008;
        this.categoryExplosion = 0x0009;

        this.matter.world.setBounds(
          52,
          0,
          this.width - 104,
          this.height - 15
        )

        const walls = this.matter.world.walls;

        for (const side of ['top', 'bottom', 'left', 'right']) {
            const wallBody = walls[side];
            wallBody.collisionFilter.category = this.categoryWorldBounds;
            wallBody.collisionFilter.mask = this.categoryHero | this.categoryEnemy | this.categoryObstacle;
        }

        inputSetup(this);


        setInterval(() => {
            if (document.hasFocus()) {
                this.focus = true;
            } else {
                this.focus = false;
            }
        }, 300);


        this.cameras.main.setSize(this.width, this.height);
        this.cameras.main.setViewport(0, 0, this.width, this.height);
        this.cameras.main.setBounds(0, 0, this.width, this.height);

        const heroConfig = {
            x: this.width / 2,
            y: this.height * .75,
            ...this.cache.json.get('hero_config')
        }

        this.scene.defaultCategory = 1;
        this.scene.defaultCollidesWith = 1;

        this.heroBike = new heroClass(this, heroConfig);

        uiCreator(this);

        this.projectiles = [];

        this.enemyConfigs = [
            {
                spriteKey: 'grunt_bike',
                hasRangedAttack: false,
                maxHealth: 100,
                bodyRadius: 9,
                spawnFrequency: 2,
                bike: {
                    tracerColor: "#e81813",
                    tailLightOffsets: {
                        base: [
                            new Phaser.Math.Vector2(-1, 4),
                            new Phaser.Math.Vector2(0, 4)
                        ],
                        left: [
                            new Phaser.Math.Vector2(-4, 4),
                            new Phaser.Math.Vector2(-3, 4)
                        ],
                        right: [
                            new Phaser.Math.Vector2(2, 4),
                            new Phaser.Math.Vector2(3, 4)
                        ]
                    }
                }
            },
            {
                spriteKey: 'tandem_bike_enemy',
                hasRangedAttack: true,
                maxHealth: 140,
                bodyRadius: 11,
                spawnFrequency: 1,
                bike: {
                    tracerColor: "#e81813",
                    tailLightOffsets: {
                        base: [
                            new Phaser.Math.Vector2(-2, 3),
                            new Phaser.Math.Vector2(1, 3)
                        ],
                        left: [
                            new Phaser.Math.Vector2(-4, 3),
                            new Phaser.Math.Vector2(-1, 3)
                        ],
                        right: [
                            new Phaser.Math.Vector2(0, 3),
                            new Phaser.Math.Vector2(3, 3)
                        ]
                    }
                },
                gunOffsets: {
                    center: {
                        right_right: { x: 10, y: -4 },
                        down_right:  { x: 9,  y: 6 },
                        down_down:   { x: 3,  y: 6 },
                        down_left:   { x: -8, y: 4 },
                        left_left:   { x: -10, y: -4 },
                        up_left:     { x: -9, y: -8 },
                        up_up:       { x: 7,  y: -12 },
                        up_right:    { x: 9,  y: -8 }
                    },
                    right_turn: {
                        right_right: { x: 12, y: -4 },
                        down_right:  { x: 12, y: 5 },
                        down_down:   { x: 7,  y: 6 },
                        down_left:   { x: -4, y: 5 },
                        left_left:   { x: -8, y: -4 },
                        up_left:     { x: -7, y: -8 },
                        up_up:       { x: 10,  y: -12 },
                        up_right:    { x: 12, y: -8 }
                    },
                    left_turn: {
                        right_right: { x: 6,  y: -3 },
                        down_right:  { x: 5,  y: 6 },
                        down_down:   { x: 0,  y: 6 },
                        down_left:   { x: -13, y: 6 },
                        left_left:   { x: -12, y: -3 },
                        up_left:     { x: -13, y: -7 },
                        up_up:       { x: 3, y: -12 },
                        up_right:    { x: 5,  y: -8 }
                    }
                }
            }
        ];


        this.enemyManager = new EnemyManager(this, {
            enemyConfigs: this.enemyConfigs, // your array
            target: this.heroBike,
            minX: 80,
            maxX: this.sys.canvas.width - 80,
            spawnInterval: 7000,
            maxEnemies: 2
        });

        const levelConfig = {
            tilesetKey: 'tileset',
            tilesetImageKey: 'base_tiles',
            defaultRegion: 'city',
            regions: {
                city: {
                    mapSections: ['city_01', 'city_02', 'city_03'],
                    allowedObstacles: ['barrel_moveable', 'small_barrier', 'small_barrier_moveable', 'barrel_explosive', 'long_barrier', 'ramp'],
                    obstacleSpawnRateMultiplier: 1.0
                }
            },
            transitions: {
                atScore: [
                    { threshold: 1000, toRegion: 'industrial' }
                ],
                atTrigger: {
                    bossStart: 'industrial'
                }
            }
        };
        
        this.roadManager = new RoadManager(this, levelConfig);

        const obstacleConfig = {
            minX: 70,
            maxX: 250,
            spawnInterval: 800,
            obstacleTypes: [
                {
                    spriteKey: "small_barrier",
                    shape: "circle",
                    radius: 7,
                    spawnFrequency: 20
                },
                {
                    spriteKey: "long_barrier",
                    shape: "rectangle",
                    width: 12,
                    height: 180,
                    spawnFrequency: 6,
                    maxCount: 1,
                },
                {
                    spriteKey: "small_barrier_moveable",
                    shape: "circle",
                    radius: 7,
                    spawnFrequency: 15,
                    moveable: true
                },
                {
                    spriteKey: "barrel_moveable",
                    shape: "circle",
                    radius: 6,
                    spawnFrequency: 15,
                    moveable: true
                },
                {
                    spriteKey: "barrel_explosive",
                    shape: "circle",
                    radius: 6,
                    spawnFrequency: 11,
                    moveable: true,
                    explosive: true,
                    explosionRadius: 31,
                    explosionDelay: 200,
                    explosionDamage: 100,
                    explosionKnockback: 2
                },
                {
                    spriteKey: 'ramp',
                    width: 32,
                    height: 56,
                    spawnFrequency: 20,
                    maxCount: 1,
                }
            ]
        }     
        this.obstacleManager = new ObstacleManager(this, obstacleConfig, this.roadManager); 


        const powerupConfig = {
            minX: 60,
            maxX: 260,
            spawnInterval: 17000,
            powerupTypes: [
                {
                    spriteKey: 'health_big',
                    width: 16,
                    height: 16,
                    effect: (heroBody) => {
                        const hero = heroBody.gameObject?.parentRef;
                        if (hero && !hero.isDead) {
                            hero.health = Phaser.Math.Clamp(hero.health + 150, 0, hero.maxHealth);
                        }
                    },
                    soundKey: 'healthCollect'
                }
            ]
        };
        
        this.powerupManager = new PowerupManager(this, powerupConfig);

        createCollisionListeners(this);

        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key !== "Control") {
              e.preventDefault();
              e.stopPropagation();
            }
          });

        this.load.start();   

    }

    update(time, delta) {
        this.cursor.update(delta);
        uiUpdate(this, delta);
        this.heroBike.update(time, delta);
        this.enemyManager.update(time, delta);
        this.obstacleManager.update(delta);
        this.powerupManager.update(delta);
        this.roadManager.update(delta);

        this.projectiles = this.projectiles.filter(p => p.isActive);
        for (const p of this.projectiles) {
            p.update();
        }

        const smoothing = 0.15;
        this.displayScrollSpeed += (this.scrollSpeed - this.displayScrollSpeed) * smoothing;
    }
}

export default CykoCityTest;
