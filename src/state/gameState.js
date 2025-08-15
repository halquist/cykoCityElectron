export const gameState = {
    gang: {
      cash: 0,
      members: [],     // [{id,name,role,attrs,...}]
      structures: {},  // { gang_hang: {level:1}, ... }
      unlocks: {},     // { hasGenerator: true, ... }
    },
    hero: {
      bike: { id: 'starter', parts: {} },
      implants: {},
      weapons: { melee: [], ranged: [] },
      inventory: {},
    }
  };
  
  // simple helpers
  export const setGang = (partial) => Object.assign(gameState.gang, partial);
  export const setHero = (partial) => Object.assign(gameState.hero, partial);