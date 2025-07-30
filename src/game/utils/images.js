export const imageLoader = (scene) => {

    scene.load.image("base_tiles", "assets/environment/tilesets/cyko_city_tileset_2.png");

    scene.load.tilemapTiledJSON("city_01", "assets/environment/backgrounds/test_street_ver_1.json");
    scene.load.tilemapTiledJSON("city_02", "assets/environment/backgrounds/test_street_ver_2.json");
    scene.load.tilemapTiledJSON("city_03", "assets/environment/backgrounds/test_street_ver_3.json");

    // scene.load.aseprite("hero_bike", "assets/hero_bike/biker_sprite_attack.png", "assets/hero_bike/biker_sprite_attack.json", {
    //     frameWidth: 30,
    //     frameHeight: 20,
    //     })
    scene.load.aseprite("basic_hero", "assets/hero_bike/basic_hero.png", "assets/hero_bike/basic_hero.json", {
        frameWidth: 30,
        frameHeight: 20,
        })
    scene.load.aseprite("basic_hero_bike", "assets/hero_bike/basic_hero_bike.png", "assets/hero_bike/basic_hero_bike.json", {
        frameWidth: 30,
        frameHeight: 20,
        })
    scene.load.aseprite("melee_chain", "assets/hero_bike/melee_chain.png", "assets/hero_bike/melee_chain.json", {
        frameWidth: 30,
        frameHeight: 20,
        })
    scene.load.aseprite("melee_sword", "assets/hero_bike/melee_sword.png", "assets/hero_bike/melee_sword.json", {
        frameWidth: 30,
        frameHeight: 20,
        })
    scene.load.aseprite("ranged_handgun", "assets/hero_bike/ranged_handgun.png", "assets/hero_bike/ranged_handgun.json", {
        frameWidth: 30,
        frameHeight: 20,
        })
    scene.load.aseprite("ranged_smg", "assets/hero_bike/ranged_smg.png", "assets/hero_bike/ranged_smg.json", {
        frameWidth: 30,
        frameHeight: 20,
        })
    scene.load.aseprite("ranged_particle_cannon", "assets/hero_bike/ranged_particle_cannon.png", "assets/hero_bike/ranged_particle_cannon.json", {
        frameWidth: 30,
        frameHeight: 20,
        })

    scene.load.aseprite("grunt_bike", "assets/enemies/grunt_biker/grunt_bike.png", "assets/enemies/grunt_biker/grunt_bike.json", {
        frameWidth: 30,
        frameHeight: 20,
        })

    scene.load.aseprite("tandem_bike_enemy", "assets/enemies/tandem_biker/tandem_bike_enemy.png", "assets/enemies/tandem_biker/tandem_bike_enemy.json", {
        frameWidth: 30,
        frameHeight: 30,
        })

    scene.load.image('small_barrier', 'assets/environment/obstacles/barrier_small_2.png');
    scene.load.image('long_barrier', 'assets/environment/obstacles/barrier_long_2.png');
    scene.load.image('ramp', 'assets/environment/obstacles/ramp_2.png');
    scene.load.aseprite("small_barrier_moveable", "assets/environment/obstacles/small_barrier_moveable.png", "assets/environment/obstacles/small_barrier_moveable.json", {
        frameWidth: 16,
        frameHeight: 16,
        })
    scene.load.aseprite("barrel_moveable", "assets/environment/obstacles/barrel_moveable.png", "assets/environment/obstacles/barrel_moveable.json", {
        frameWidth: 16,
        frameHeight: 16,
        })
    scene.load.aseprite("barrel_explosive", "assets/environment/obstacles/barrel_explosive_7.png", "assets/environment/obstacles/barrel_explosive_7.json", {
        frameWidth: 40,
        frameHeight: 40,
        })
    scene.load.aseprite("health_big", "assets/powerups/health_big.png", "assets/powerups/health_big.json", {
        frameWidth: 16,
        frameHeight: 16,
        })
  
  }
  
  export const imageCreator = (scene) => {
    
  
  }
  
  