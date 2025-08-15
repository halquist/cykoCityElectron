import Phaser from 'phaser';

// one global emitter you can import anywhere
export const events = new Phaser.Events.EventEmitter();

// example channels you’ll use later:
// events.emit('menu:apply', { path: 'gang.members', op: 'add', value: newGuy })
// events.emit('menu:close')