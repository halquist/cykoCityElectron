import Projectile from "./projectileClass.js"
import { applyDamage } from "../utils/damage.js";
import { spawnSparks, updateSparks, updateTracers, updateRubberMarks, spawnExhaust, updateExhaustClouds } from "../utils/fx.js";

export default class Enemy {
    constructor(scene, config) {
        this.scene = scene;
        this.spriteKey = config.spriteKey;
        this.target = config.target; // should be the Hero instance
        this.type = "enemy";

        this.bodySprite = scene.matter.add.sprite(config.x, config.y, config.spriteKey, 0, {
            isSensor: false
        });
        this.bodySprite.setCircle(config.bodyRadius);
        this.bodySprite.setFixedRotation();
        this.bodySprite.setBounce(1);
        this.bodySprite.setFriction(0);
        this.bodySprite.setFrictionAir(0.04);
        this.bodySprite.setMass(1); 
        this.bodySprite.setVisible(false);
        this.bodySprite.setCollisionCategory(this.scene.categoryEnemy);
        this.bodySprite.setCollidesWith([]);
        this.bodySprite.parentRef = this;

        this.collisionEnabled = false;
        this.enteringFromOffscreen = true;

        this.displaySprite = scene.add.sprite(config.x, config.y, config.spriteKey);
        this.displaySprite.setOrigin(0.5, 0.5);
        
        if (!this.scene.anims.exists(this.spriteKey + '_center')) {
            this.scene.anims.createFromAseprite(this.spriteKey);
        }

        this.state = 'patrol'; // or 'approach', 'attack'
        this.meleeAttackTimer = 0;
        this.meleeCooldown = 2000;
        this.meleeKnockback = 1.2;
        this.isMeleeAttacking = false;
        this.hasSpawnedMeleeSpark = false;
        this.meleeAttackDirection = 'left'; // or 'right'
        this.meleeDamageMin = 25;
        this.meleeDamageMax = 45;
        this.meleeAttackDamageDelay = 200;
        this.knockbackTimer = 0;
        this.knockbackDuration = 200; // milliseconds

        this.hasRangedAttack = config.hasRangedAttack || false;
        this.isRangedAttacking = false;
        this.rangedAttackTimer = 0;
        this.rangedCooldown = 1500; // ms
        this.projectileSpeed = 300;
        this.inProjectileMode = false;
        this.rangedKnockback = 0.7
        this.rangedDamageMin = 20;
        this.rangedDamageMax = 30;

        this.maxHealth = config.maxHealth;
        this.health = this.maxHealth;
        this.isDead = false;
        this.deathDriftSpeed = 2; // px/sec
        this.deathAnimPlayed = false;
        this.damageCooldown = 100;
        this.damageCooldownTimer = 0;
        this.activeMeleeSensors = [];
        
        this.currentVelocity = new Phaser.Math.Vector2(0, 0);
        this.desiredVelocity = new Phaser.Math.Vector2(0, 0);
        this.vertUpMoveSpeed = 1;
        this.vertDownMoveSpeed = 2;
        this.horzMoveSpeed = 2;

        this.patrolDir = 1; // -1 or 1 for left/right patrol
        this.patrolSwitchTimer = 0;
        this.patrolSwitchInterval = 2000;

        this.activeSparks = [];
        this.deathSparkTimer = 0;
        this.deathSparkInterval = 50 + Math.random() * 50; // 100–200ms random interval

        this.tracers = [];
        this.tracerSpacingTimer = 0;
        this.tracerLifetime = 0.3;
        this.tracerFadeRate = 1 / this.tracerLifetime;

        this.rubberMarks = [];
        this.rubberMarkSpacingTimer = 0;
        this.brakeHoldTime = 0;
        this.brakeMaxMarkDuration = 400;

        this.exhaustClouds = [];
        this.exhaustThreshold = 30;
        this.exhaustTimer = 0;
        this.exhaustInterval = 60; // ms

        this.tailLightOffsetsBase = config.bike.tailLightOffsets.base;
        this.tailLightOffsetsLeft = config.bike.tailLightOffsets.left;
        this.tailLightOffsetsRight = config.bike.tailLightOffsets.right;
        this.tracerColor = Phaser.Display.Color.ValueToColor(config.bike.tracerColor).color;
        this.tailLightOffsets = [
            this.tailLightOffsetsBase[0].clone(),
            this.tailLightOffsetsBase[1].clone()
        ];

        this.rubberMarkOffsets = [
            new Phaser.Math.Vector2(-1, -5),
            new Phaser.Math.Vector2(-1, 7)
        ];

        this.gunOffsets = config.gunOffsets || {};
    }

    enterFromOffscreen() {
        const enterSpeed = 3;
        if (this.bodySprite.y < 0) {
            this.desiredVelocity.set(0, enterSpeed); // entering from top
        } else if (this.bodySprite.y > this.scene.height) {
            this.desiredVelocity.set(0, -enterSpeed); // entering from bottom
        }
    
        const buffer = 20;
        if (this.bodySprite.y >= buffer && this.bodySprite.y <= this.scene.height - buffer) {
            this.enteringFromOffscreen = false;
            this.enableCollision();
        }
    }

    updateAI(delta) {
        if (!this.bodySprite?.body || this.isDead) return;
        if (!this.target?.bodySprite?.body) {
            this.desiredVelocity.set(0, 0);
            return;
        }
        if (this.enteringFromOffscreen) {
            this.enterFromOffscreen();
            return;
        }
        const distToHero = Phaser.Math.Distance.Between(
            this.bodySprite.x, this.bodySprite.y,
            this.target.bodySprite.x, this.target.bodySprite.y
        );
    
        // Handle post-attack cooldown
        if (this.state === 'cooldown') {
            this.cooldownTimer -= delta;
            if (this.cooldownTimer <= 0) {
                this.state = 'patrol';
            } else {
                this.desiredVelocity.set(0, 0);
                return;
            }
        }
    
        if (distToHero < 20 && this.hasRangedAttack === false && !this.isMeleeAttacking && this.canAttack()) {
            this.state = 'attack';
            this.isMeleeAttacking = true;
            this.meleeAttackTimer = 0;
            this.meleeAttackDirection = (this.target.bodySprite.x >= this.bodySprite.x) ? 'right' : 'left';
            // this.desiredVelocity.set(0, 0);
            this.scene.soundObj.meleeSwing1.play({ delay: 0.1});
            this.meleeAttackDelayTimer = this.scene.time.delayedCall(
                this.meleeAttackDamageDelay,
                () => {
                  this.spawnMeleeSensor();
                  this.meleeAttackDelayTimer = null;
                }
            );
            return;
        } else if (distToHero < 160 && this.hasRangedAttack && !this.isRangedAttacking && this.canAttack()) {
            this.state = 'attack';
            this.isRangedAttacking = true;
            this.rangedAttackTimer = 0;
            // this.desiredVelocity.set(0, 0);
            this.inProjectileMode = true;
            this.scene.time.delayedCall(1000, () => {
                if (!this.isDead && this.bodySprite?.body) {
                    this.fireProjectileAtHero();
                }
            });
            return;
        }
    
        if (distToHero < 160) {
            this.state = 'approach';
        } else {
            this.state = 'patrol';
        }
    
        if (this.state === 'patrol') {
            this.patrolSwitchTimer += delta;
            if (this.patrolSwitchTimer >= this.patrolSwitchInterval) {
                this.patrolSwitchTimer = 0;
                this.patrolDir *= -1;
            }
            this.desiredVelocity.set(this.horzMoveSpeed * this.patrolDir, 0);
        } else if (this.state === 'approach') {
            const dx = this.target.bodySprite.x - this.displaySprite.x;
            const dy = this.target.bodySprite.y - this.displaySprite.y;
            this.desiredVelocity.set(
                Math.abs(dx) > 10 ? (dx > 0 ? this.horzMoveSpeed : -this.horzMoveSpeed) : 0,
                Math.abs(dy) > 10 ? (dy > 0 ? this.vertDownMoveSpeed : -this.vertUpMoveSpeed) : 0
            );
        }
    }

    fireProjectileAtHero() {
        if (!this.bodySprite || !this.target?.bodySprite?.body) return;
    
        const moveState =
            this.currentVelocity.x < -5 ? "left_turn" :
            this.currentVelocity.x > 5 ? "right_turn" : "center";
    
        const directionZone = this.getCursorDirectionZoneToTarget();
    
        const offset =
            (this.gunOffsets[moveState] && this.gunOffsets[moveState][directionZone]) ||
            this.gunOffsets.center[directionZone] || { x: 0, y: 0 };
    
        const origin = new Phaser.Math.Vector2(
            this.bodySprite.x + offset.x,
            this.bodySprite.y + offset.y
        );
    
        const target = new Phaser.Math.Vector2(
            this.target.bodySprite.x,
            this.target.bodySprite.y
        );
    
        const dir = target.clone().subtract(origin).normalize();
        const speed = 7;
    
        const vx = dir.x * speed;
        const vy = dir.y * speed;
    
        const proj = new Projectile(this.scene);
        proj.fire(origin.x, origin.y, vx, vy, this, { knockback: this.rangedKnockback, length: 20, color: "#6ae6aa" }); // 'this' as owner
        this.scene.projectiles.push(proj);
    
        this.scene.soundObj.gunshot1.play();
    }
    

    spawnMeleeSensor() {
        if (!this.bodySprite?.body) return;
        const offsetX = this.meleeAttackDirection === 'left' ? -12 : 12;
        const sensor = this.scene.matter.add.rectangle(
            this.bodySprite.x + offsetX,
            this.bodySprite.y,
            8,
            16,
            {
                isSensor: true,
                isStatic: true,
                label: 'enemyMeleeSensor',
                collisionFilter: {
                    category: this.scene.categoryEnemySensor,
                    mask: this.scene.categoryObstacle | this.scene.categoryHero // only hit the hero
                }
            }
        );
    
        this.scene.activeMeleeSensors.set(sensor, this); // store attacker
        this.activeMeleeSensors.push(sensor);
    
        this.scene.time.delayedCall(50, () => {
            if (!this.scene || !this.scene.matter || this.isDead) return;
        
            if (sensor) {
                this.scene.matter.world.remove(sensor);
                this.scene.activeMeleeSensors.delete(sensor);
        
                const i = this.activeMeleeSensors?.indexOf(sensor);
                if (i !== -1) {
                    this.activeMeleeSensors.splice(i, 1);
                }
            }
        });
    }
    
    

    move(delta) {
        if (!this.bodySprite?.body) return;
    
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;
    
            // Allow physics to move body, but still sync displaySprite to body
            const bodyPos = this.bodySprite.body.position;
            this.displaySprite.setPosition(Math.round(bodyPos.x), Math.round(bodyPos.y));
            return;
        }
    
        this.currentVelocity.lerp(this.desiredVelocity, 0.1);
        this.bodySprite.setVelocity(
            this.currentVelocity.x,
            this.currentVelocity.y
        );
    
        const bodyPos = this.bodySprite.body.position;
        this.displaySprite.setPosition(Math.round(bodyPos.x), Math.round(bodyPos.y));
    }

    animate(delta) {
        const moveState = this.getMoveState();
    
        // === Melee Attack ===
        if (this.isMeleeAttacking) {
            const animKey = `${moveState}_${this.meleeAttackDirection}_melee_attack`;
            const fullAnimKey = `${this.spriteKey}_${animKey}`;
            const currentName = this.displaySprite.anims.getName();

            const anim = this.scene.anims.get(fullAnimKey);
            const animDuration = anim ? anim.frames.length * (1000 / anim.frameRate) : 600;
            const progress = this.meleeAttackTimer < animDuration
                ? Phaser.Math.Clamp(this.meleeAttackTimer / animDuration, 0, 1)
                : null;

            const forceChange = currentName !== fullAnimKey;
            if (progress >= 1 || progress === null) {
                this.playAnimation(`${moveState}`, true);
            } else {
                this.playAnimation(animKey, forceChange, null, progress);
                if (progress >= 0.4 && !this.hasSpawnedMeleeSpark) {
                    this.spawnSparks(this.displaySprite.x, this.displaySprite.y, this.meleeAttackDirection);
                    this.hasSpawnedMeleeSpark = true;
                }
            }
    
    
            this.meleeAttackTimer += delta;
    
            if (this.meleeAttackTimer >= this.meleeCooldown) {
                this.isMeleeAttacking = false;
                this.state = 'cooldown';
                this.cooldownTimer = this.meleeCooldown;
                this.hasSpawnedMeleeSpark = false;
                this.playAnimation(`${moveState}`, true);
            }
    
            return;
        }
    
        // === Ranged Attack ===
        if (this.isRangedAttacking || this.inProjectileMode) {
            const dirZone = this.getCursorDirectionZoneToTarget();
            const animKey = `${moveState}_shoot_${dirZone}`;
            this.playAnimation(animKey, true);
    
            if (this.isRangedAttacking) {
                this.rangedAttackTimer += delta;
                if (this.rangedAttackTimer > this.rangedCooldown) {
                    this.isRangedAttacking = false;
                    this.inProjectileMode = false;
                    this.state = 'cooldown';
                    this.cooldownTimer = this.rangedCooldown;
                }
            }
    
            return;
        }
    
        // === Idle / Movement ===
        this.playAnimation(`${moveState}`, true);
    }
    

    playAnimation(animKey, force = false, frameIndex = null, progress = null) {
        const sprite = this.displaySprite;
        if (!sprite || !sprite.anims) return;
    
        const fullAnimKey = `${this.spriteKey}_${animKey}`;
        const currentName = sprite.anims.getName();
        const needsChange = currentName !== fullAnimKey;
    
        if (needsChange || force || progress !== null) {
            sprite.anims.play(fullAnimKey, true);
    
            const anim = sprite.anims.currentAnim;
            if (anim?.frames?.length > 0) {
                if (progress !== null) {
                    const frameCount = anim.frames.length;
                    const frameIdx = Math.floor(Phaser.Math.Clamp(progress, 0, 1) * frameCount);
                    const targetFrame = anim.frames[Math.min(frameIdx, frameCount - 1)];
                    if (targetFrame) {
                        sprite.anims.setCurrentFrame(targetFrame);
                    }
                } else if (frameIndex !== null && anim.frames[frameIndex]) {
                    sprite.anims.setCurrentFrame(anim.frames[frameIndex]);
                }
            }
        }
    
        this.currentAnimation = animKey;
    }

    getMoveState() {
        if (!this.bodySprite?.body) return 'center';
    
        const velocityX = this.bodySprite.body.velocity.x;
        const threshold = 0.5; // Tune based on your physics scale
    
        if (velocityX < -threshold) {
            return 'left_turn';
        } else if (velocityX > threshold) {
            return 'right_turn';
        } else {
            return 'center';
        }
    }

    getCursorDirectionZoneToTarget() {
        if (!this.target || !this.target.bodySprite || !this.target.bodySprite.body) {
            return 'center';
        }
        const dx = this.target.bodySprite.x - this.displaySprite.x;
        const dy = this.target.bodySprite.y - this.displaySprite.y;
        const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
        
        if (angle >= -22.5 && angle < 22.5) return 'right_right';
        if (angle >= 22.5 && angle < 67.5) return 'down_right';
        if (angle >= 67.5 && angle < 112.5) return 'down_down';
        if (angle >= 112.5 && angle < 157.5) return 'down_left';
        if (angle >= 157.5 || angle < -157.5) return 'left_left';
        if (angle >= -157.5 && angle < -112.5) return 'up_left';
        if (angle >= -112.5 && angle < -67.5) return 'up_up';
        if (angle >= -67.5 && angle < -22.5) return 'up_right';
    
        return 'center'; // fallback
    }

    spawnSparks = (x, y, side) => {
        spawnSparks(this, x, y, side, () => this.displaySprite.depth + 1);
    };
    
    updateSparks = (delta) => {
        updateSparks(this, delta);
    };

    updateTracers = (delta) => {
        updateTracers(this, delta, {
            getSprite: () => this.displaySprite,
            tracerColor: this.tracerColor,
            getTargetOffsets: () => {
                const moveState = this.getMoveState();
                if (moveState === "right_turn") return this.tailLightOffsetsRight;
                if (moveState === "left_turn") return this.tailLightOffsetsLeft;
                return this.tailLightOffsetsBase;
            },
            shouldEmit: () => !this.isDead && this.currentVelocity.y < -50
        });
    };

    takeDamage(damage, knockback, x, y, type) {
        applyDamage({
            scene: this.scene,
            target: this,
            damageAmount: damage,
            knockback,
            attackerX: x,
            attackerY: y,
            damageType: type,
            isHero: false,
            multiSprite: false
        });
    }
    
      

    cancelAttack() {
        this.isMeleeAttacking = false;
        this.meleeAttackTimer = 0;
      
        // Optionally stop animation
        this.displaySprite.anims.stop();
      
        // Cancel any pending sensor spawn if it's scheduled
        if (this.meleeAttackDelayTimer) {
          this.meleeAttackDelayTimer.remove(false);
          this.meleeAttackDelayTimer = null;
        }
      
        // Clear tint or reset visuals if needed
    }

    destroy() {
        // Prevent repeated destruction
        if (this.isDestroyed) return;
        this.isDestroyed = true;
    
        // Remove from scene update list (if added)
        this.scene.children.remove(this.displaySprite);
    
        // Destroy display sprite
        if (this.displaySprite && this.displaySprite.destroy) {
            this.displaySprite.destroy(true); // ensure children & events removed
        }
    
        // Destroy physics sprite
        if (this.bodySprite && this.bodySprite.destroy) {
            this.bodySprite.destroy();
        }
    
        // Destroy effects
        for (const spark of this.activeSparks || []) {
            spark.graphics?.destroy();
        }
        for (const tracer of this.tracers || []) {
            tracer.graphics?.destroy();
        }
        for (const mark of this.rubberMarks || []) {
            mark.graphics?.destroy();
        }
        for (const smoke of this.exhaustClouds || []) {
            smoke.graphics?.destroy();
        }   
    }

    handleDying(delta) {
        // === Death Drift ===
        if (this.bodySprite?.body) {
            this.bodySprite.setVelocity(0, this.deathDriftSpeed);
            const bodyPos = this.bodySprite.body.position;
            this.displaySprite.setPosition(Math.round(bodyPos.x), Math.round(bodyPos.y));
        } else {
            this.displaySprite.y += (this.deathDriftSpeed);
        }
    
        // === Destroy Headlight ===
        if (this.headlight) {
            this.headlight.destroy();
            this.headlight = null;
        }
    
        // === Remove Physics Body When Offscreen ===
        const spriteY = this.displaySprite.y;
        if (spriteY > this.scene.height + 40) {
            this.destroy();
            return;
        } else if (spriteY > this.scene.height - 30 && this.bodySprite?.body) {
            this.scene.matter.world.remove(this.bodySprite.body);
            this.bodySprite.body = null;
        }
    
        // === Play Death Animation Once ===
        if (!this.deathAnimPlayed) {
            this.scene.soundObj.deathGrunt1.play();
            const deathAnimKey = `death`;
    
            this.playAnimation(deathAnimKey, true);
    
            const anim = this.displaySprite.anims.currentAnim;
            if (anim && anim.key === `${this.spriteKey}_death`) {
                this.displaySprite.once('animationcomplete', (a) => {
                    if (a.key === `${this.spriteKey}_death`) {
                        this.displaySprite.anims.pause(anim.frames.at(-1));
                    }
                });
            }
    
            this.deathAnimPlayed = true;
        }
    
        // === Spark Effects ===
        this.deathSparkTimer += delta;
        if (this.deathSparkTimer >= this.deathSparkInterval) {
            this.deathSparkTimer = 0;
            this.deathSparkInterval = 50 + Math.random() * 50;
            const side = Math.random() < 0.5 ? "left" : "right";
            this.spawnSparks(this.displaySprite.x, this.displaySprite.y, side);
        }
    
        // === Other Effects ===
        this.updateSparks(delta);
        this.updateTracers(delta);
        updateRubberMarks(this, delta, { isHero: false });
        updateExhaustClouds(this, delta);
    }
    

    enableCollision() {
        if (this.collisionEnabled) return;
        this.collisionEnabled = true;
        this.bodySprite.setCollidesWith([this.scene.categoryHero, this.scene.categoryEnemy, this.scene.categoryObstacle, this.scene.categoryProjectile, this.scene.categoryExplosion, this.scene.categoryWorldBounds]);
    }

    canAttack() {
        return this.damageCooldownTimer <= 0 && !this.isDead;
    }

    update(time, delta) {
        if (this.isDead) {
            this.handleDying(delta);
            return;
        }
    
        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer -= delta;
        }

        if (this.health <= this.exhaustThreshold) {
            this.exhaustTimer += delta;
            if (this.exhaustTimer >= this.exhaustInterval) {
                this.exhaustTimer = 0;
                spawnExhaust(this, this.bodySprite.x, this.bodySprite.y);
            }
            updateExhaustClouds(this, delta);
        }
    
        this.displaySprite.setDepth(this.displaySprite.y);
        this.updateAI(delta);
        this.move(delta);
        this.animate(delta);
        this.updateSparks(delta);
        this.updateTracers(delta);
        updateRubberMarks(this, delta, { isHero: false });
    }
}
