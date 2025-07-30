import Phaser from 'phaser';
const { Scene, AUTO } = Phaser;
import cykoCityTest from "../game/scenes/back_alley_battleground.js"

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
      enableSleep: true,
      gravity: false,
      // fps: 120,
      // timeScale: 1,          // Default speed
      // positionIterations: 6, // Optional: improve collision resolution
      // velocityIterations: 4  // Optional: improve bounce/response quality
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
  pixelArt: true,
  roundPixels: true,
  autoRound: true,
  antialias: false,
  expandParent: true,
  gameTitle: "CYKO CITY",
  gameVerson: 0.1,
  scene: cykoCityTest,
}

const game = new Phaser.Game(config)
