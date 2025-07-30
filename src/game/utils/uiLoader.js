import Cursor from "../components/cursorClass.js"

const uiLoader = (scene) => {
  scene.load.aseprite("cursor", "assets/ui/target_cursor.png", "assets/ui/target_cursor.json");
  scene.load.aseprite("death_message", "assets/ui/death_message.png", "assets/ui/death_message.json");
  scene.load.image('ui_base', 'assets/ui/ui_base.png');
  scene.load.image('health_bar_highlights', 'assets/ui/health_bar_highlights.png');
  scene.load.image('ranged_card', 'assets/ui/ranged_card.png');
  scene.load.image('ranged_magazine', 'assets/ui/magazine.png');
  scene.load.image('ranged_particle_cannon_icon', 'assets/ui/particle_cannon_icon.png');
  scene.load.image('ranged_handgun_icon', 'assets/ui/gun.png');
  scene.load.image('ranged_smg_icon', 'assets/ui/smg_icon.png');
  scene.load.image('ranged_bullets', 'assets/ui/bullets.png');
  scene.load.aseprite("ranged_reload", "assets/ui/reload_anim.png", "assets/ui/reload_anim.json");
  scene.load.image('melee_chain_icon', 'assets/ui/melee_chain_icon.png');
  scene.load.image('melee_sword_icon', 'assets/ui/melee_sword_icon.png');
  scene.load.image('dash_ability', 'assets/ui/dash_ability.png');
  scene.load.image('dash_ability_depleted', 'assets/ui/dash_ability_depleted.png');
}

export const uiCreator = (scene) => {
  scene.anims.createFromAseprite('cursor');
  scene.anims.createFromAseprite('ranged_reload');
  scene.anims.createFromAseprite('death_message');

  scene.cursor = new Cursor({
    scene: scene,
    x: scene.middleX,
    y: scene.middley,
    key: "cursor",
  })

  scene.mouse = scene.input.mousePointer

  scene.ui = {};

  scene.ui.x = scene.width / 2;
  scene.ui.y = scene.height - 8;

  scene.ui.base = scene.add.image(scene.ui.x, scene.ui.y, 'ui_base');
  scene.ui.base.setScrollFactor(0);       // makes it static on screen
  scene.ui.base.setDepth(1010);           // ensure it's above gameplay elements

  createHealthBar(scene);
  createRangedCard(scene);
  createMeleeCard(scene);
  createAbilityCard(scene);
}

export const uiUpdate = (scene, delta = 16.66) => {
  updateHealthBar(scene);
  updateRangedCard(scene, delta);
  updateAbilityCard(scene, delta);
};

const createAbilityCard = (scene) => {
  const abilityCardLeftX = 69
  const abilityCardLeftY = scene.height - 7;
  scene.abilityCard = {};
  scene.abilityCard.left = scene.add.image(abilityCardLeftX, abilityCardLeftY, 'dash_ability');
  scene.abilityCard.left.setScrollFactor(0);
  scene.abilityCard.left.setDepth(1012);
  scene.abilityCard.mask = scene.make.graphics({ x: 0, y: 0, add: false });
  scene.abilityCard.left.setMask(
    scene.abilityCard.mask.createGeometryMask()
  );

  scene.abilityCard.leftDepleted = scene.add.image(abilityCardLeftX, abilityCardLeftY, 'dash_ability_depleted');
  scene.abilityCard.leftDepleted.setScrollFactor(0);
  scene.abilityCard.leftDepleted.setDepth(1011);
}

const updateAbilityCard = (scene, delta) => {
  const hero = scene.heroBike;
  const card = scene.abilityCard;

  const fullHeight = card.left.height - 4;
  const width = card.left.width;

  card.mask.clear();

  const t = Phaser.Math.Clamp(hero.dashCooldownElapsed / hero.dashCooldownDuration, 0, 1);

  if (hero.dashCooldown) {
    // Cooldown active: reveal from bottom up
    const visibleHeight = fullHeight * t;
    const bottom = card.left.y + fullHeight / 2;

    card.mask.fillStyle(0xffffff);
    card.mask.fillRect(
      card.left.x - width / 2,
      bottom - visibleHeight,
      width,
      visibleHeight
    );
  } else {
    // Cooldown over: fully visible
    card.mask.fillStyle(0xffffff);
    card.mask.fillRect(
      card.left.x - width / 2,
      card.left.y - fullHeight / 2,
      width,
      fullHeight
    );
  }
};


const createHealthBar = (scene) => {
  const centerX = scene.width / 2;
  const barWidth = 94;
  const barHeight = 8;
  const barY = scene.height - 8; 

  scene.healthBar = {};

  // health bar
  scene.healthBar.bar = scene.add.graphics();
  scene.healthBar.bar.setScrollFactor(0);
  scene.healthBar.bar.setDepth(999);
  scene.healthBar.bar.x = centerX - 160;
  scene.healthBar.bar.y = barY -1;

  // health bar background
  scene.healthBar.healthBarBg = scene.add.graphics();
  scene.healthBar.healthBarBg.setScrollFactor(0);
  scene.healthBar.healthBarBg.setDepth(998);
  scene.healthBar.healthBarBg.fillStyle(0x262726, 1);
  scene.healthBar.healthBarBg.fillRect(0, 0, barWidth, barHeight);
  scene.healthBar.healthBarBg.x = centerX - barWidth / 2;
  scene.healthBar.healthBarBg.y = barY;

  scene.healthBar.healthBarHighlight = scene.add.image(centerX, barY, 'health_bar_highlights');
  scene.healthBar.healthBarHighlight.setScrollFactor(0);       // makes it static on screen
  scene.healthBar.healthBarHighlight.setDepth(1008);           // ensure it's above gameplay elements
  scene.healthBar.healthBarHighlight.setAlpha(0.6);

  // Save UI bar dimensions
  scene.healthBar.healthBarWidth = barWidth;
  scene.healthBar.healthBarHeight = barHeight;

  scene.healthBar.healthBarUI = {
    currentRatio: 1,
    flickerTimer: 0,
    lastHp: 99999
  };
}

const updateHealthBar = (scene) => {
  const neonGreenBlue = Phaser.Display.Color.ValueToColor(0x00ffcc); // full
  const neonBlue      = Phaser.Display.Color.ValueToColor(0x00bfff); // mid
  const neonPink      = Phaser.Display.Color.ValueToColor(0xff1cff); // low
  const white         = Phaser.Display.Color.ValueToColor(0xffffff); // flash color

  const uiState = scene.healthBar.healthBarUI;
  const maxHealth = scene.heroBike.maxHealth;
  const targetRatio = Phaser.Math.Clamp(scene.heroBike.health / maxHealth, 0, 1);

  // Trigger flash when health drops
  if (scene.heroBike.health < uiState.lastHp) {
    uiState.flickerTimer = 10; // ~166ms at 60fps
  }

  uiState.lastHp = scene.heroBike.health;

  // Ease ratio toward actual health
  uiState.currentRatio += (targetRatio - uiState.currentRatio) * 0.06;
  const ratio = uiState.currentRatio;

  // Base color (interpolated)
  let baseColor;
  if (ratio > 0.5) {
    const t = (ratio - 0.5) * 2;
    baseColor = Phaser.Display.Color.Interpolate.ColorWithColor(neonBlue, neonGreenBlue, 1, t);
  } else {
    const t = ratio * 2;
    baseColor = Phaser.Display.Color.Interpolate.ColorWithColor(neonPink, neonBlue, 1, t);
  }

  // Flash to white
  let finalColor;
  if (uiState.flickerTimer > 0) {
    uiState.flickerTimer--;
    finalColor = ((Math.floor(uiState.flickerTimer / 2) % 2) === 0) ? white : baseColor;
  } else {
    finalColor = baseColor;
  }

  const hex = Phaser.Display.Color.GetColor(finalColor.r, finalColor.g, finalColor.b);

  // Draw bar
  const fullWidth = scene.healthBar.healthBarWidth;
  const height = scene.healthBar.healthBarHeight;
  const centerX = scene.width / 2;
  const y = 1;
  let currentWidth = fullWidth * ratio;
  if (targetRatio > 0 && currentWidth < 4) {
    currentWidth = 4;
  }
  const leftX = centerX - currentWidth / 2;

  scene.healthBar.bar.clear();
  scene.healthBar.bar.fillStyle(hex, 1);
  scene.healthBar.bar.fillRect(leftX, y, currentWidth, height);
}

const createRangedCard = (scene) => {
  const rangedCardX = scene.width - 91;
  const rangedCardY = scene.height - 3;

  scene.rangedCard = {};

  const currentWeapon = scene.heroBike?.currentRangedWeapon;
  const spriteKey = currentWeapon?.spriteKey ? currentWeapon?.spriteKey + '_icon' : 'ranged_gun_icon';

  // magazine background
  scene.rangedCard.magazine = scene.add.image(rangedCardX, rangedCardY, 'ranged_magazine');
  scene.rangedCard.magazine.setScrollFactor(0);
  scene.rangedCard.magazine.setDepth(1011);

  // gun image (dynamic)
  scene.rangedCard.gun = scene.add.image(rangedCardX, rangedCardY - 4, spriteKey);
  scene.rangedCard.gun.setScrollFactor(0);
  scene.rangedCard.gun.setDepth(1012);

  // bullets
  scene.rangedCard.bullets = scene.add.image(rangedCardX, rangedCardY, 'ranged_bullets');
  scene.rangedCard.bullets.setScrollFactor(0);
  scene.rangedCard.bullets.setDepth(1012);
  scene.rangedCard.bulletMask = scene.make.graphics({ x: 0, y: 0, add: false });
  scene.rangedCard.bullets.setMask(
    scene.rangedCard.bulletMask.createGeometryMask()
  );

  // reload icon
  scene.rangedCard.reload = scene.add.sprite(rangedCardX, rangedCardY - 6, 'ranged_reload');
  scene.rangedCard.reload.setScrollFactor(0);
  scene.rangedCard.reload.setDepth(1012);
  scene.rangedCard.reload.setVisible(false);

  // Update gun display when weapon changes
  scene.rangedCard.updateDisplay = (currentRangedWeapon) => {
    const newSpriteKey = currentRangedWeapon?.spriteKey + '_icon';
    scene.rangedCard.gun.setTexture(newSpriteKey);
  };
};

const updateRangedCard = (scene, delta) => {
  const fullWidth = scene.rangedCard.bullets.width / 2;
  const bulletCount = scene.heroBike.currentRangedWeapon.maxAmmo;
  const current = scene.heroBike.currentRangedWeapon.currentAmmo;

  // Clear and redraw mask
  scene.rangedCard.bulletMask.clear();

  // Compute visible width
  const visibleWidth = (current / bulletCount) * fullWidth;

  scene.rangedCard.bulletMask.fillStyle(0xffffff);
  scene.rangedCard.bulletMask.fillRect(
    scene.rangedCard.bullets.x - fullWidth,
    scene.rangedCard.bullets.y - scene.rangedCard.bullets.height / 2,
    visibleWidth,
    scene.rangedCard.bullets.height
  );

  if (scene.heroBike.isReloading) {
    scene.rangedCard.reload.anims.play("reload_spinner", true);
    scene.rangedCard.reload.setVisible(true);
    scene.rangedCard.gun.setVisible(false);
  } else {
    scene.rangedCard.reload.setVisible(false);
    scene.rangedCard.gun.setVisible(true);
    scene.rangedCard.reloadTimer = null;
  }
};


const createMeleeCard = (scene) => {
  const meleeCardX = 90;
  const meleeCardY = scene.height - 8;

  scene.meleeCard = {};

  const currentWeapon = scene.heroBike?.currentMeleeWeapon;
  const spriteKey = currentWeapon?.spriteKey ? currentWeapon?.spriteKey + '_icon' : 'melee_chain_icon';

  // melee weapon image
  scene.meleeCard.weapon = scene.add.image(meleeCardX, meleeCardY, spriteKey);
  scene.meleeCard.weapon.setScrollFactor(0);
  scene.meleeCard.weapon.setDepth(1012);

  // Add update method to refresh UI when weapon changes
  scene.meleeCard.updateDisplay = (currentMeleeWeapon) => {
    const spriteKey = currentMeleeWeapon?.spriteKey + '_icon';
    scene.meleeCard.weapon.setTexture(spriteKey);
  };
};


export default uiLoader
