// StructureRegistry.js
export const STRUCTURES = {
    gang_hang: {
      key: 'gang_hang',
      displayName: 'Hangout',
      levels: [
        { texture:'gang_hang', hitbox:{w:64,h:40,ox:0,oy:12} }
      ],
      menu: 'gang_hang_menu',
      menuTitle: 'Gang Management',
    //   onHover: (sprite)=> sprite.setTint(0x9ad1ff),
    //   onUnhover: (sprite)=> sprite.clearTint(),
    },
    cykanic: {
        key: 'cykanic',
        displayName: 'Cykanic Shop',
        levels: [
          { texture:'cykanic', hitbox:{w:64,h:40,ox:0,oy:12} }
        ],
        menu: 'cykanic_menu',
        menuTitle: 'Cykanic Shop',
        // onHover: (sprite)=> sprite.setTint(0x9ad1ff),
        // onUnhover: (sprite)=> sprite.clearTint(),
    },
    clinik: {
        key: 'clinik',
        displayName: 'Clinik',
        levels: [
          { texture:'clinik', hitbox:{w:64,h:40,ox:0,oy:12} }
        ],
        menu: 'clinik_menu',
        menuTitle: 'Clinik',
        // onHover: (sprite)=> sprite.setTint(0x9ad1ff),
        // onUnhover: (sprite)=> sprite.clearTint(),
    },
    street_corner: {
        key: 'street_corner',
        displayName: 'Street Corner',
        levels: [
          { texture:'street_corner', hitbox:{w:64,h:40,ox:0,oy:12} }
        ],
        menu: 'street_corner_menu',
        menuTitle: 'Deala',
        // onHover: (sprite)=> sprite.setTint(0x9ad1ff),
        // onUnhover: (sprite)=> sprite.clearTint(),
    },
    black_market: {
        key: 'black_market',
        displayName: 'Black Market',
        levels: [
          { texture:'black_market', hitbox:{w:64,h:40,ox:0,oy:12} }
        ],
        menu: 'black_market_menu',
        menuTitle: 'Black Market',
        // onHover: (sprite)=> sprite.setTint(0x9ad1ff),
        // onUnhover: (sprite)=> sprite.clearTint(),
    },
    ramp_entrance: {
        key: 'ramp_entrance',
        displayName: 'Lets Ride',
        levels: [
          { texture:'ramp_entrance', hitbox:{w:64,h:40,ox:0,oy:12} }
        ],
        menu: 'start_level',
        // onHover: (sprite)=> sprite.setTint(0x9ad1ff),
        // onUnhover: (sprite)=> sprite.clearTint(),
    },
  };
  