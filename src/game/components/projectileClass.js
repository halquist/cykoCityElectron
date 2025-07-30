export default class Projectile {
  constructor(scene) {
    this.scene = scene;

    // Use graphics for a line-shaped visual
    this.display = scene.add.graphics();
    this.display.setVisible(false);
    this.display.setActive(false);

    const Matter = Phaser.Physics.Matter.Matter;
    this.body = Matter.Bodies.circle(0, 0, 2, {
      isSensor: true,
      isStatic: false,
      label: 'projectile'
    });

    this.body.collisionFilter.category = scene.categoryProjectile;
    this.body.collisionFilter.mask =
      scene.categoryEnemy | scene.categoryObstacle | scene.categoryHero;

    this.body.gameObject = this.display;
    this.body.parentRef = this;

    this.scene.matter.world.add(this.body);

    this.depth = 400;
    

    this.isActive = false;
    this.owner = null;
    this.angleRad = 0;
  }

  fire(x, y, vx, vy, owner, weaponConfig) {
    this.owner = owner;
    this.weaponConfig = weaponConfig;
    this.knockback = weaponConfig.knockback || 0;
    this.isActive = true;
    this.color = weaponConfig.color ? Phaser.Display.Color.ValueToColor(weaponConfig.color).color : 0x8fffc9;
    this.length = weaponConfig.length;
  
    this.origin = { x, y }; // store static origin
    this.angleRad = Math.atan2(vy, vx); // store angle at fire-time
  
    this.scene.matter.body.setPosition(this.body, { x, y });
  
    if (weaponConfig.type === 'beam') {
      this.fireBeam(); // do this immediately
    } else {
      this.fireProjectile(x, y, vx, vy);
    }
  }


  fireBeam() {
    const length = 1000;
    const dx = Math.cos(this.angleRad);
    const dy = Math.sin(this.angleRad);
    const endX = this.origin.x + dx * length;
    const endY = this.origin.y + dy * length;
  
    // Run static raycast
    this.scene.time.delayedCall(50, () => {
      const hits = this.scene.matter.intersectRay(this.origin.x, this.origin.y, endX, endY);
    
      for (const hit of hits) {
        const ref = hit?.gameObject?.parentRef;
        if (!ref) continue;
    
        if (ref.type === 'enemy' && ref.takeDamage) {
          const dmg = Phaser.Math.Between(this.weaponConfig.damageMin, this.weaponConfig.damageMax);
          ref.takeDamage(dmg, 0, this.origin.x, this.origin.y, 'beam');
        }
    
        if (ref.isExplosive && !ref.hasExploded) {
          ref.triggerExplosion?.();
          return;
        } 

        if (ref.moveable && !ref.hasCollided) {
            ref.hasCollided = true;
        
            // Calculate direction vector from beam origin to object center
            const dx = ref.x - this.origin.x;
            const dy = ref.y - this.origin.y;
            const mag = Math.hypot(dx, dy);
        
            if (mag > 0) {
                const knockbackScale = 1.5; // tune as needed
                const vx = (dx / mag) * knockbackScale;
                const vy = (dy / mag) * knockbackScale;
                ref.setVelocity?.(vx, vy);
            }
        
            this.playFallenAnimation(ref, this.scene);
            return;
        }
      }
    });
  
    // Draw static beam and destroy quickly
    this.drawBeam(this.origin.x, this.origin.y, endX, endY, this.color);
    this.scene.time.delayedCall(80, () => this.destroy(), [], this);
  }

  playFallenAnimation(obstacle, scene) {
    scene.time.delayedCall(200, () => {
        if (!scene?.sys || obstacle._destroyed || obstacle.hasExploded || !obstacle.body) return;
        obstacle.anims?.play(`${obstacle.texture.key}_fallen`, true);
        obstacle.setCollidesWith?.([scene.categoryObstacle]);
    });
}

  drawBeam(x1, y1, x2, y2) {
    this.isActive = true;
    this.display.setVisible(true);
    this.display.setActive(true);
    this.display.depth = 400;
    this.display.clear();
    this.display.lineStyle(1, this.color);
    this.display.beginPath();
    this.display.moveTo(x1 - this.origin.x, y1 - this.origin.y);
    this.display.lineTo(x2 - this.origin.x, y2 - this.origin.y);
    this.display.strokePath();
    this.display.setPosition(this.origin.x, this.origin.y);
  }

  fireProjectile(x, y, vx, vy) {
    this.isActive = true;
    this.scene.matter.body.setPosition(this.body, { x, y });
    this.scene.matter.body.setVelocity(this.body, { x: vx, y: vy });
  
    this.display.setVisible(true);
    this.display.setActive(true);
  
    this.expireTimer = this.scene.time.delayedCall(2000, () => this.destroy(), [], this);
  }

  update() {
    if (!this.isActive || !this.body) return;
    if (this.weaponConfig?.type === 'beam') return;

    const pos = this.body.position;
    this.display.setPosition(pos.x, pos.y);
    this.display.clear();

    // Draw a line in the direction of velocity
    const dx = Math.cos(this.angleRad) * this.length;
    const dy = Math.sin(this.angleRad) * this.length;

    this.display.lineStyle(1, this.color);
    this.display.beginPath();
    this.display.moveTo(-dx / 2, -dy / 2); // center the line on position
    this.display.lineTo(dx / 2, dy / 2);
    this.display.strokePath();

    // Off-screen cleanup
    if (
      pos.y < -20 || pos.y > this.scene.height + 20 ||
      pos.x < -20 || pos.x > this.scene.width + 20
    ) {
      this.destroy();
    }
  }

  destroy() {
    if (!this.isActive) return;
    this.isActive = false;
  
    this.display.setVisible(false);
    this.display.setActive(false);
  
    if (this.body) {
      this.scene.matter.world.remove(this.body);
      this.body = null; // <<< ADD THIS LINE
    }
  
    this.display.destroy();
  }
}
