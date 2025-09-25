import Phaser from 'phaser';
const { Scene, AUTO } = Phaser;
import MainMenu from "../game/scenes/MainMenu.js"
import GangCamp from "../game/scenes/GangCamp.js"
import MenuOverlay from '../../public/assets/menu/MenuOverlay.js';
import TestLevel from "../game/scenes/back_alley_battleground.js"
import { GameConfig } from "../game/config/gameConfig.js"

const width = 320
const height = 180

const config = {
  type: Phaser.WEBGL,
  // backgroundColor: '#000000',
  scale: {
    parent: "cyko_city_game",
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: width,
    height: height,
    snap: { width, height }
  },
  physics: {
    default: "matter",
    matter: {
      enableSleep: GameConfig.physics.enableSleep,
      gravity: GameConfig.physics.gravity,
      fps: GameConfig.physics.fps,
      timeScale: 1,
      positionIterations: GameConfig.physics.positionIterations,
      velocityIterations: GameConfig.physics.velocityIterations,
      constraintIterations: GameConfig.physics.constraintIterations,
      // debug: {
      //   showCollisions: true,
      //   showVelocity: true,
      //   showBounds: true,
      //   showAxes: true,
      //   showAngleIndicator: true,
      // },
    },
  },
  fps: {
    target: 60,
    smoothStep: true,
    forceSetTimeOut: true,
    deltaHistory: 10,        // stabilizes delta averaging
    min: 30,
    max: 60
  },
  input: {
    gamepad: true,
  },
  audio: {
    disableWebAudio: false
  },
  autoFocus: true,
  disableContextMenu: true,
  pixelArt: GameConfig.rendering.pixelArt,
  roundPixels: GameConfig.rendering.roundPixels,
  autoRound: true,
  antialias: GameConfig.rendering.antialias,
  expandParent: true,
  gameTitle: "CYKO CITY",
  gameVerson: 0.1,
  scene: [
    MainMenu,
    GangCamp,
    MenuOverlay,
    TestLevel
  ],
}

const game = new Phaser.Game(config)
