import { Boot } from './scenes/Boot.js';
import { Game as MainGame } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Preloader } from './scenes/Preloader.js';
import { AUTO, Game } from 'phaser';
import cykoCityTest from "./scenes/back_alley_battleground.js"


// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig

const width = 320;
const height = 180;

const config = {
    type: Phaser.WEBGL,
    width: width,
    height: height,
    backgroundColor: '#000000',
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
        fps: 60,
        // timeScale: 1,          // Default speed
        // positionIterations: 6, // Optional: improve collision resolution
        // velocityIterations: 4  // Optional: improve bounce/response quality
        // debug: true
        // debug: {
          // showCollisions: true,
          // showVelocity: true,
          // showBounds: true,
          // showAxes: true,
          // showAngleIndicator: true,
        // },
      },
    },
    fps: {
      target: 60,
      smoothStep: true,
      // forceSetTimeOut: true
    },
    input: {
      gamepad: true,
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


// const config = {
//     type: AUTO,
//     width: 1024,
//     height: 768,
//     parent: 'game-container',
//     backgroundColor: '#028af8',
//     scale: {
//         mode: Phaser.Scale.FIT,
//         autoCenter: Phaser.Scale.CENTER_BOTH
//     },
//     scene: [
//         Boot,
//         Preloader,
//         MainMenu,
//         MainGame,
//         GameOver
//     ]
// };

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;
