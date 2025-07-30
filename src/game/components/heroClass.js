import Projectile from "./projectileClass.js"
import { applyDamage } from "../utils/damage.js";
import { spawnSparks, updateSparks, updateTracers, updateRubberMarks, spawnExhaust, updateExhaustClouds } from "../utils/fx.js";

export default class Hero {
    constructor(scene, config) {
        this.scene = scene;
        this.spriteKey = config.spriteKey;
        this.type = config.type;

        const { x, y } = config;

        // === BODY CONFIG ===
        const bodyCfg = config.body || {};
        const radius = bodyCfg.radius || 9;
        const mass = bodyCfg.mass || 5;

        this.bodySprite = scene.matter.add.sprite(x, y, this.spriteKey, 0);
        this.bodySprite.setCircle(radius);
        this.bodySprite.setFixedRotation();
        this.bodySprite.setBounce(1);
        this.bodySprite.setFriction(0);
        this.bodySprite.setFrictionAir(0);
        this.bodySprite.setMass(mass);
        this.bodySprite.setVisible(false);
        this.bodySprite.parentRef = this;
        this.bodySprite.setCollisionCategory(this.scene.categoryHero);
        this.bodySprite.setCollidesWith([this.scene.categoryEnemy, this.scene.categoryObstacle, this.scene.categoryPowerup, this.scene.categoryWorldBounds, this.scene.categoryProjectile, this.scene.categoryExplosion]);


          // === DISPLAY SPRITE ===
        this.bikeSprite = scene.add.sprite(x, y, config.bike.spriteKey);
        this.bikeSprite.setOrigin(0.5, 0.5);
        this.bikeSprite.name = config.bike.spriteKey;
        this.riderSprite = scene.add.sprite(x, y, config.rider.spriteKey);
        this.riderSprite.setOrigin(0.5, 0.5);
        this.riderSprite.name = config.rider.spriteKey;
        // this.meleeWeaponSprite = scene.add.sprite(x, y, config.melee.spriteKey);
        // this.meleeWeaponSprite.setOrigin(0.5, 0.5);
        
        
        this.meleeWeapons = config.meleeWeapons || [];
        this.currentMeleeWeaponIndex = 0;
        this.currentMeleeWeapon = this.meleeWeapons[this.currentMeleeWeaponIndex];
        this.meleeWeaponSprite = scene.add.sprite(x, y, this.currentMeleeWeapon.spriteKey);
        this.meleeWeaponSprite.name = this.currentMeleeWeapon.spriteKey;
        this.meleeWeaponSprite.setOrigin(0.5, 0.5);

        this.rangedWeapons = config.rangedWeapons || [];
        this.currentRangedWeaponIndex = 0;
        this.currentRangedWeapon = this.rangedWeapons[this.currentRangedWeaponIndex];
        this.rangedWeaponSprite = scene.add.sprite(x, y, this.currentRangedWeapon);
        this.rangedWeaponSprite.name = this.currentRangedWeapon.spriteKey;
        this.rangedWeaponSprite.setOrigin(0.5, 0.5);


        this.initAnimations(scene, config);

         // === ATTRIBUTES ===
        const attr = config.attributes || {};

        this.vertUpMoveSpeed = attr.vertUpMoveSpeed ?? 80;
        this.vertDownMoveSpeed = attr.vertDownMoveSpeed ?? 150;
        this.horzMoveSpeed = attr.horzMoveSpeed ?? 300;
        this.fastScrollSpeed = attr.fastScrollSpeed ?? 120;

        this.maxHealth = attr.maxHealth ?? 300;
        this.health = this.maxHealth;

        this.meleeDamageMin = 0;
        this.meleeDamageMax = 0;
        this.meleeCooldown = 0;
        this.meleeHoldStartTime = null;
        this.meleeChargeThreshold = 200; 
        this.meleeInputActive = false;
        this.meleeKnockback = 0;
        this.damageCooldown = attr.damageCooldown ?? 500;
        this.knockbackDuration = attr.selfKnockbackDuration ?? 200;

        this.rangedDamageMin = this.currentRangedWeapon.damageMin;
        this.rangedDamageMax = this.currentRangedWeapon.damageMax;
        this.rangedCooldown = this.currentRangedWeapon.cooldown;

        this.deathDriftSpeed = 2;
        this.deathAnimPlayed = false;



        // === JUMP ===
        this.jumpDuration = attr.jumpDuration ?? 800;
        this.jumpSpeed = attr.jumpSpeed ?? 6;

        // === DASH ABILITY ===
        const dash = config.abilities?.dash || {};
        this.dashSpeed = dash.speed ?? 3;
        this.dashDuration = dash.duration ?? 1000;
        this.dashCooldownDuration = dash.cooldown ?? 8000;
        this.dashDamage = dash.damage ?? 100;
        this.dashKnockback = dash.knockback ?? 3;

        // === GUN OFFSETS ===
        this.gunOffsets = config.gunOffsets || this.gunOffsets;

        // === Set default state values ===
        this.isReloading = false;
        this.inProjectileMode = false;
        this.prevReloadInput = false;
        this.currentVelocity = new Phaser.Math.Vector2(0, 0);
        this.desiredVelocity = new Phaser.Math.Vector2(0, 0);
        this.momentumTime = 0.15;
        this.momentumTimer = 0;
        this.inputHoldTime = 0;
        this.minDriftFactor = 0.2;
        this.bounceCooldown = 0;
        this.downMove = false;
        this.upMove = false;
        this.leftMove = false;
        this.rightMove = false;
        this.isMeleePressed = false;
        this.isMeleeAttacking = false;
        this.meleeAttackDirection = null;
        this.meleeAttackFrame = 0;
        this.meleeAttackTimer = 0;
        this.isJumping = false;
        this.jumpTimer = 0;
        this.isDashing = false;
        this.dealDashDamage = false;
        this.dashCooldown = false;
        this.dashCooldownElapsed = 0;
        this.prevDashInput = false;
        this.usingGamepad = false;
        this.hasSpawnedMeleeSpark = false;
        this.damageCooldownTimer = 0;
        this.knockbackTimer = 0;
        this.lastShotTime = this.scene.time.now;
        this.frozenTailOffsets = null;
        this.brakeHoldTime = 0;
        this.brakeMaxMarkDuration = 400;
        this.currentAnimation = "";
        this.lastHorizontal = null;
        this.lastVertical = null;
        this.tracerLifetime = 0.5;
        this.tracerFadeRate = 1 / this.tracerLifetime;
        this.tracerSpacingTimer = 0;
        this.tracerColor = Phaser.Display.Color.ValueToColor(config.bike.tracerColor).color;
        this.rubberMarkSpacingTimer = 0;
        this.isDead = false;

        this.prevDpadState = {
            left: false,
            right: false,
            up: false,
            down: false
        };

        // child arrays
        this.tracers = [];
        this.rubberMarks = [];
        this.activeSparks = [];
        this.activeMeleeSensors = [];

        this.exhaustClouds = [];
        this.exhaustThreshold = 70;
        this.exhaustTimer = 0;
        this.exhaustInterval = 60; // ms

        // vector offsets
        this.tailLightOffsetsBase = [
            new Phaser.Math.Vector2(-2, 3),
            new Phaser.Math.Vector2(1, 3)
        ];
        this.tailLightOffsetsLeft = [
            new Phaser.Math.Vector2(-6, 3),
            new Phaser.Math.Vector2(-3, 3)
        ];
        this.tailLightOffsetsRight = [
            new Phaser.Math.Vector2(2, 3),
            new Phaser.Math.Vector2(5, 3)
        ];
        this.tailLightOffsets = [
            this.tailLightOffsetsBase[0].clone(),
            this.tailLightOffsetsBase[1].clone()
        ];
        this.rubberMarkOffsets = [
            new Phaser.Math.Vector2(-1, -5),
            new Phaser.Math.Vector2(-1, 7)
        ];
    }

    initAnimations (scene, config) {
        // Step 1: Create default animations from Aseprite
        scene.anims.createFromAseprite(config.rider.spriteKey);
        scene.anims.createFromAseprite(config.bike.spriteKey);
        for (let weapon of config.meleeWeapons) {
            scene.anims.createFromAseprite(weapon.spriteKey);
        }
        for (let weapon of config.rangedWeapons) {
            scene.anims.createFromAseprite(weapon.spriteKey);
        }
    
        // Step 2: List of all spriteKeys that might have a death_loop animation
        const spriteKeys = [
            config.rider.spriteKey,
            config.bike.spriteKey,
            ...config.meleeWeapons.map(w => w.spriteKey),
            ...config.rangedWeapons.map(w => w.spriteKey)
        ];
    
        for (const key of spriteKeys) {
            const deathLoopKey = `${this.spriteKey}_${key}_death_loop`;
            const anim = scene.anims.get(deathLoopKey);
            if (!anim) continue;
    
            // Step 3: Clone existing animation data with repeat: -1
            const newAnimConfig = {
                key: anim.key + "_used", // give new name since it will fail to create duplicate
                frames: anim.frames.map(frame => ({
                    key: frame.textureKey,
                    frame: frame.frame.name
                })),
                frameRate: anim.frameRate,
                repeat: -1
            };
    
            scene.anims.create({ ...newAnimConfig, overwrite: true });
        }
    }

    inputCheck() {
        const keys = this.scene.keys;
        this.downMove = keys.S.isDown;
        this.upMove = keys.W.isDown;
        this.leftMove = keys.A.isDown;
        this.rightMove = keys.D.isDown;
    
        const gamepad = this.scene.input.gamepad.getPad(0);
        const threshold = 0.2;
        let gamepadUsed = false;
    
        if (gamepad) {
            const axisH = gamepad.axes.length > 0 ? gamepad.axes[0].getValue() : 0;
            const axisV = gamepad.axes.length > 1 ? gamepad.axes[1].getValue() : 0;
    
            const anyButtonPressed = gamepad.buttons.some(b => b?.pressed || b?.value > 0.1);
            gamepadUsed ||= Math.abs(axisH) > threshold || Math.abs(axisV) > threshold;
            gamepadUsed ||= anyButtonPressed;
    
            this.leftTrigger = gamepad.buttons[6]?.value > 0.1;
    
            this.leftMove ||= axisH < -threshold;
            this.rightMove ||= axisH > threshold;
            this.upMove ||= axisV < -threshold;
            this.downMove ||= axisV > threshold;
        }
    
        this.usingGamepad = gamepadUsed;
        this.scene.input.mouse.disableContextMenu();
        this.scene.input.manager.canvas.style.cursor = this.usingGamepad ? "none" : "default";
    
        const pointer = this.scene.mouse;
        const rightMouse = pointer.rightButtonDown();
        this.inProjectileMode = this.usingGamepad ? this.leftTrigger : rightMouse;
    
        const mousePressed = pointer.leftButtonDown();
        const padPressed =
            gamepad &&
            (gamepad.buttons[4]?.pressed || gamepad.buttons[5]?.pressed);
    
        const fireInput = pointer.leftButtonDown() || gamepad?.buttons[7]?.value > 0.1;
    
        if (this.inProjectileMode && fireInput && this.currentRangedWeapon.currentAmmo <= 0) {
            const sound = this.scene.soundObj.emptyGun1;
            if (!sound.isPlaying) {
                sound.play();
            }
        } else if (this.inProjectileMode && fireInput && this.canShoot()) {
            this.fireProjectileAtCursor();
        }
    
        const reloadInput = this.usingGamepad ? gamepad?.buttons[2]?.pressed : keys.R.isDown;
        if (reloadInput && !this.prevReloadInput) {
            this.reload();
        }
        this.prevReloadInput = reloadInput;
    
        const meleeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        const dpadLeftPressed = gamepad?.left && !this.prevDpadState.left;
        const dpadRightPressed = gamepad?.right && !this.prevDpadState.right;
        if (Phaser.Input.Keyboard.JustDown(meleeKey) || dpadRightPressed) {
            this.cycleMeleeWeapon(1);
        } else if (dpadLeftPressed) {
            this.cycleMeleeWeapon(-1);
        }
    
        const rangedKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        const dpadUpPressed = gamepad?.up && !this.prevDpadState.up;
        const dpadDownPressed = gamepad?.down && !this.prevDpadState.down;
        if (Phaser.Input.Keyboard.JustDown(rangedKey) || dpadDownPressed) {
            this.cycleRangedWeapon(1);
        } else if (dpadUpPressed) {
            this.cycleRangedWeapon(-1);
        }
    
        if (gamepad) {
            this.prevDpadState.left = gamepad.left;
            this.prevDpadState.right = gamepad.right;
            this.prevDpadState.up = gamepad.up;
            this.prevDpadState.down = gamepad.down;
        }
    
        const dashInput = this.usingGamepad ? gamepad?.buttons[0]?.pressed : keys.SPACE.isDown;
        if (dashInput && !this.prevDashInput && !this.isDashing && !this.dashCooldown) {
            this.startDashAttack();
        }
        this.prevDashInput = dashInput;
    
        const meleeInputActive = mousePressed || padPressed;
    
        // Detect melee input start
        if (meleeInputActive && !this.meleeInputActive && !this.isMeleeAttacking && this.canAttack()) {
            this.meleeInputActive = true;
            this.meleeHoldStartTime = this.scene.time.now;

            // 🡺 Determine attack direction at press time
            if (this.usingGamepad) {
                const gamepad = this.scene.input.gamepad.getPad(0);
                const leftPressed = gamepad?.buttons[4]?.pressed;
                const rightPressed = gamepad?.buttons[5]?.pressed;
                this.pendingMeleeDirection = rightPressed ? 'right' : leftPressed ? 'left' : 'right'; // fallback to right
            } else {
                this.pendingMeleeDirection = this.scene.mouse.worldX > this.bodySprite.x ? 'right' : 'left';
            }
        }
    
        // Detect melee input release
        if (!meleeInputActive && this.meleeInputActive && !this.isMeleeAttacking && this.canAttack()) {
            const heldDuration = this.scene.time.now - this.meleeHoldStartTime;
            const attackType = heldDuration >= this.meleeChargeThreshold ? "strong" : "fast";
            this.executeMeleeAttack(attackType);
            this.meleeInputActive = false;
        }
    
        // Optional: Auto-trigger strong attack if held long enough
        if (
            this.meleeInputActive &&
            !this.isMeleeAttacking &&
            this.canAttack() &&
            (this.scene.time.now - this.meleeHoldStartTime) >= this.meleeChargeThreshold &&
            !this.strongAttackTriggered
        ) {
            this.executeMeleeAttack("strong");
            this.strongAttackTriggered = true;
            this.meleeInputActive = false;
        }
    
        if (!meleeInputActive) {
            this.strongAttackTriggered = false;
        }
    }

    executeMeleeAttack(type = "fast") {
        const weapon = this.currentMeleeWeapon;
        const config = weapon.attacks[type];
        this.meleeAttackType = type;
    
        // 🡺 Use direction from input press
        this.meleeAttackDirection = this.pendingMeleeDirection || 'right';
    
        this.isMeleeAttacking = true;
        this.meleeAttackTimer = 0;
        this.hasSpawnedMeleeSpark = false;
        this.meleeCooldown = config.cooldown ?? this.meleeCooldown;
        this.meleeDamageMin = config.damageMin;
        this.meleeDamageMax = config.damageMax;
        this.meleeKnockback = config.knockback;
    
        this.meleeAttackDelayTimer = this.scene.time.delayedCall(
            config.damageDelay,
            () => {
                this.spawnMeleeSensor(type);
                this.meleeAttackDelayTimer = null;
            }
        );
    
        this.scene.time.delayedCall(config.cooldown, () => {
            this.isMeleeAttacking = false;
        });
    
        this.scene.soundObj.meleeSwing1.play({ delay: config.soundDelay });
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

    animate(delta) {
        const moveState = this.getMoveState();
    
        if (this.isDashing) {
            const animKey = `dash_attack`;
            this.playAnimation(animKey, true);
            return;
        }
    
        if (this.isMeleeAttacking) {
            const attackType = this.meleeAttackType === "fast" ? "fast_" : ""
            const animKey = `${moveState}_${this.meleeAttackDirection}_melee_${attackType}attack`;
            const fullAnimKey = `${this.spriteKey}_${this.riderSprite.name}_${animKey}`;
            const currentName = this.riderSprite.anims.getName();

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
            
                if (progress >= 0.7 && !this.hasSpawnedMeleeSpark) {
                    this.spawnMeleeSparks(this.bodySprite.x, this.bodySprite.y, this.meleeAttackDirection);
                    this.hasSpawnedMeleeSpark = true;
                }
            }

        
            this.meleeAttackTimer += delta;
        
            if (this.meleeAttackTimer >= this.meleeCooldown) {
                this.isMeleeAttacking = false;
                this.playAnimation(`${moveState}`, true);
            }
        
            return;
        }
    
        if (this.inProjectileMode && this.damageCooldownTimer <= 0) {
            const dirZone = this.getCursorDirectionZone();
            const animKey = `${moveState}_shoot_${dirZone}`;
            this.playAnimation(animKey, true);
            return;
        }
    
        this.playAnimation(`${moveState}`, true);
    }
    
    playAnimation(animKey, force = false, frameIndex = null, progress = null) {
        const sprites = [
            this.bikeSprite,
            this.riderSprite,
            this.meleeWeaponSprite,
            this.rangedWeaponSprite
        ];
    
        for (const sprite of sprites) {
            if (!sprite?.anims) continue;
    
            const fullAnimKey = `${this.spriteKey}_${sprite.name}_${animKey}`;
            const currentName = sprite.anims.getName();
            const needsChange = currentName !== fullAnimKey;
    
            if (needsChange || (force && !sprite.anims.isPlaying)) {
                sprite.anims.play(fullAnimKey, true);
    
                // Ensure animation is initialized before accessing frames
                const anim = sprite.anims.currentAnim;
                if (anim && anim.frames && anim.frames.length > 0) {
                    if (progress !== null) {
                        const frameCount = anim.frames.length;
                        const frameIdx = Math.floor(Phaser.Math.Clamp(progress, 0, 1) * frameCount);
                        const targetFrame = anim.frames[Math.min(frameIdx, frameCount - 1)];
                        if (targetFrame) {
                            sprite.anims.setCurrentFrame(targetFrame);
                        }
                    } else if (
                        frameIndex !== null &&
                        anim.frames[frameIndex]
                    ) {
                        sprite.anims.setCurrentFrame(anim.frames[frameIndex]);
                    }
                }
            }
        }
    
        this.currentAnimation = animKey;
    }
    
    move(delta) {
        if (this.isJumping || this.disableSteering) return;
    
        const deltaSeconds = delta / 1000;
    
        // Handle knockback: allow physics but skip movement logic
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;
            return;
        }
    
        const baseVX = this.horzMoveSpeed;
        const baseUpVY = this.vertUpMoveSpeed;
        const baseDownVY = this.vertDownMoveSpeed;
    
        let vx = 0;
        let vy = 0;
    
        // === Scroll Speed + Boost Sound ===
        const shouldBoost = this.upMove || this.dealDashDamage;
        this.scene.scrollSpeed = shouldBoost ? this.fastScrollSpeed : this.scene.baseScrollSpeed;
    
        if (shouldBoost) {
            if (!this.scene.soundObj.powerBoost1.isPlaying) {
                this.scene.soundObj.powerBoost1.play();
            }
        } else {
            this.scene.soundObj.powerBoost1.stop();
        }
    
        // === Input-Based Velocity ===
        if (this.upMove && (!this.downMove || this.lastVertical === 'up')) {
            vy = -baseUpVY;
        } else if (this.downMove && (!this.upMove || this.lastVertical === 'down')) {
            vy = baseDownVY;
        }
    
        if (this.leftMove && (!this.rightMove || this.lastHorizontal === 'left')) {
            vx = -baseVX;
        } else if (this.rightMove && (!this.leftMove || this.lastHorizontal === 'right')) {
            vx = baseVX;
        }
    
        // === Apply or Decay Velocity ===
        if (vx !== 0 || vy !== 0) {
            this.desiredVelocity.set(vx, vy);
            this.momentumTimer = this.momentumTime;
            this.inputHoldTime += deltaSeconds;
            this.isInputActive = true;
        } else {
            if (this.isInputActive) {
                const driftScale = Phaser.Math.Clamp(this.inputHoldTime / 0.5, 0.25, 1.0);
                this.desiredVelocity.scale(driftScale);
                this.inputHoldTime = 0;
                this.isInputActive = false;
            }
    
            this.momentumTimer -= deltaSeconds;
            if (this.momentumTimer <= 0) {
                this.desiredVelocity.set(0, 0);
            }
        }
    
        // === Apply to body ===
        this.currentVelocity.lerp(this.desiredVelocity, 10 * deltaSeconds);
        this.bodySprite.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    }

    spawnMeleeSparks = (x, y, side) => {
        spawnSparks(this, x, y, side, () => this.bikeSprite.depth + 1);
    };
    
    updateSparks = (delta) => {
        updateSparks(this, delta);
    };

    updateTracers = (delta) => {
        updateTracers(this, delta, {
            getSprite: () => this.bikeSprite,
            tracerColor: this.tracerColor,
            getTargetOffsets: () => {
                const moveState = this.getMoveState();
                if (this.isDashing) return this.tailLightOffsetsBase;
                if (this.frozenTailOffsets) return this.frozenTailOffsets;
                if (moveState === "right_turn") return this.tailLightOffsetsRight;
                if (moveState === "left_turn") return this.tailLightOffsetsLeft;
                return this.tailLightOffsetsBase;
            },
            shouldEmit: () => (this.upMove || this.dealDashDamage) && !this.isDead
        });
    };

    spawnMeleeSensor() {
        const offsetX = this.meleeAttackDirection === 'left' ? -12 : 12;
        const width = this.currentMeleeWeapon.damageSensorWidth ?? 10;
        const height = this.currentMeleeWeapon.damageSensorHeight ?? 10;
        const sensor = this.scene.matter.add.rectangle(
            this.bodySprite.x + offsetX,
            this.bodySprite.y, 
            width, 
            height, 
            {
            isSensor: true,
                collisionFilter: { 
                    category: this.scene.categoryHeroSensor,
                    mask: this.scene.categoryEnemy | this.scene.categoryObstacle // only hit the enemy
                }
            });
        sensor.label = 'heroMeleeSensor';
        sensor._owner = this;
        sensor._offsetX = offsetX;
        sensor._offsetY = 0;
    
        this.scene.activeMeleeSensors.set(sensor, this); // store attacker
        this.activeMeleeSensors.push(sensor);
    
        this.scene.time.delayedCall(100, () => {
            this.scene.matter.world.remove(sensor);
            this.scene.activeMeleeSensors.delete(sensor);
            const i = this.activeMeleeSensors.indexOf(sensor);
            if (i !== -1) this.activeMeleeSensors.splice(i, 1);
        });
    }

    updateMeleeSensors() {
        for (const sensor of this.activeMeleeSensors) {
            if (sensor._owner === this) {
                const newX = this.bodySprite.x + sensor._offsetX;
                const newY = this.bodySprite.y + sensor._offsetY;
                this.scene.matter.body.setPosition(sensor, { x: newX, y: newY });
            }
        }
    }
    

    takeDamage(damage, knockback, x, y, type) {
        applyDamage({
            scene: this.scene,
            target: this,
            damageAmount: damage,
            knockback,
            attackerX: x,
            attackerY: y,
            damageType: type,
            isHero: true,
            multiSprite: true
        });
    }
    

    fireProjectileAtCursor() {
        const pointer = this.scene.cursor;
        const directionZone = this.getCursorDirectionZone();
        const moveState = this.getMoveState();
    
        const offset =
            (this.gunOffsets[moveState] && this.gunOffsets[moveState][directionZone]) ||
            this.gunOffsets.center[directionZone] || { x: 0, y: 0 };
    
        const origin = new Phaser.Math.Vector2(
            this.bikeSprite.x + offset.x,
            this.bikeSprite.y + offset.y
        );
    
        const target = new Phaser.Math.Vector2(pointer.x, pointer.y);
        const dir = target.clone().subtract(origin).normalize();
        const speed = this.currentRangedWeapon.projectileSpeed || 9;
    
        const vx = dir.x * speed;
        const vy = dir.y * speed;
    
        const proj = new Projectile(this.scene);
        proj.damageMin = this.currentRangedWeapon.damageMin;
        proj.damageMax = this.currentRangedWeapon.damageMax;
        proj.cooldown = this.currentRangedWeapon.cooldown;
        proj.fire(origin.x, origin.y, vx, vy, this, this.currentRangedWeapon);
        this.scene.projectiles.push(proj);
    
        this.lastShotTime = this.scene.time.now;
        this.currentRangedWeapon.currentAmmo -= 1;
        this.scene.soundObj[this.currentRangedWeapon.soundKey].play();  // Optional: weapon-specific sounds later
    }
    

    getCursorDirectionZone() {
        const dx = this.scene.cursor.x - this.bodySprite.x;
        const dy = this.scene.cursor.y - this.bodySprite.y;
        const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)); // -180 to 180
      
        if (angle >= -22.5 && angle < 22.5) return 'right_right';
        if (angle >= 22.5 && angle < 67.5) return 'down_right';
        if (angle >= 67.5 && angle < 112.5) return 'down_down';
        if (angle >= 112.5 && angle < 157.5) return 'down_left';
        if (angle >= 157.5 || angle < -157.5) return 'left_left';
        if (angle >= -157.5 && angle < -112.5) return 'up_left';
        if (angle >= -112.5 && angle < -67.5) return 'up_up';
        if (angle >= -67.5 && angle < -22.5) return 'up_right';
      
        return 'up_up'; // fallback
    }

    cancelAttack() {
        if (this.dealDashDamage) return;
        this.isMeleeAttacking = false;
        this.meleeAttackTimer = 0;
    
        // Stop animations on all display sprites
        const stopAnim = sprite => {
            if (sprite?.anims?.isPlaying) {
                sprite.anims.stop();
            }
        };
    
        stopAnim(this.bikeSprite);
        stopAnim(this.riderSprite);
        stopAnim(this.meleeWeaponSprite);
        stopAnim(this.rangedWeaponSprite);
    
        // Cancel any pending melee sensor spawn
        if (this.meleeAttackDelayTimer) {
            this.meleeAttackDelayTimer.remove(false);
            this.meleeAttackDelayTimer = null;
        }
    }
    

    reload() {
        const weapon = this.currentRangedWeapon;
        if (this.isReloading || weapon.currentAmmo === weapon.maxAmmo || this.isMeleeAttacking) return;
    
        this.isReloading = true;
    
        setTimeout(() => {
            this.isReloading = false;
            weapon.currentAmmo = weapon.maxAmmo;
            this.scene.soundObj.reload1.play();
    
            // Optional: Update ammo UI here if needed
            if (this.scene.rangedCard) {
                this.scene.rangedCard.updateDisplay(weapon);
            }
        }, weapon.reloadTime);
    }

    canAttack() {
        return this.damageCooldownTimer <= 0 && !this.inProjectileMode && !this.isReloading && !this.isDead;
    }

    canShoot() {
        return this.inProjectileMode && this.damageCooldownTimer <= 0 && this.scene.time.now - this.lastShotTime > this.currentRangedWeapon.cooldown && this.currentRangedWeapon.currentAmmo > 0 && !this.isMeleeAttacking && !this.isReloading && !this.isDead;
    }

    enterJumpState() {
        if (this.isJumping || this.downMove) return;
        this.isJumping = true;
        this.jumpTimer = 0;
    
        this.canTakeMeleeDamage = false;
        this.frozenTailOffsets = this.tailLightOffsets.map(o => o.clone());
    }

    handleJump(delta) {
        const deltaSeconds = delta / 1000;
        this.jumpTimer += delta;
        this.bodySprite.setCollidesWith([this.scene.categoryWorldBounds, this.scene.categoryPowerup]);
        

        // Lock direction, move straight up (or use current heading)
        this.bodySprite.body.velocity.x = 0;
        this.bodySprite.body.velocity.y = -this.jumpSpeed;

        // Apply to physics body
        this.bodySprite.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
  
        // End jump
        if (this.jumpTimer >= this.jumpDuration) {
            this.bodySprite.setCollidesWith([this.scene.categoryEnemy, this.scene.categoryObstacle, this.scene.categoryPowerup, this.scene.categoryWorldBounds, this.scene.categoryProjectile, this.scene.categoryExplosion]);
            this.isJumping = false;
            this.canTakeMeleeDamage = true;
            this.jumpTimer = 0;
            this.frozenTailOffsets = null;
            this.scene.soundObj.bikeThud1.play();
        }
  
    }

    startDashAttack() {
        this.isDashing = true;
        this.dashCooldown = true;
        // Prevent horizontal steering
        this.disableSteering = true;
        this.scene.soundObj.dash.play();

        this.scene.time.delayedCall(this.dashDuration / 2, () => {
            this.bodySprite.setVelocity(0, -this.dashSpeed); // surge forward only
            // Enable dash damage flag
            this.dealDashDamage = true;

            this.originalMass = this.bodySprite.body.mass;
            this.originalInertia = this.bodySprite.body.inertia;
            this.bodySprite.setMass(100);
            const MatterBody = Phaser.Physics.Matter.Matter.Body;
            MatterBody.setInertia(this.bodySprite.body, Infinity);
        })
    
    
        // End dash after duration
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.dealDashDamage = false;
            this.disableSteering = false;

            this.bodySprite.setMass(this.originalMass);
            const MatterBody = Phaser.Physics.Matter.Matter.Body;
            MatterBody.setInertia(this.bodySprite.body, this.originalInertia);
        });
    
        // Reset cooldown
        this.scene.time.delayedCall(this.dashCooldownDuration, () => {
            this.dashCooldown = false;
            this.dashInput = false;
        });
    }

    updateDepth() {
        const baseDepth = this.isJumping
            ? this.bodySprite.y + 30
            : this.bodySprite.y;
    
        if (this.bikeSprite) this.bikeSprite.setDepth(baseDepth);
        if (this.riderSprite) this.riderSprite.setDepth(baseDepth + 1);
        if (this.meleeWeaponSprite) this.meleeWeaponSprite.setDepth(baseDepth + 2);
        if (this.rangedWeaponSprite) this.rangedWeaponSprite.setDepth(baseDepth + 3);
    }
    

    updateDisplayPosition() {
        if (!this.bodySprite?.body) return;
        const bodyX = Math.round(this.bodySprite.body.position.x);
        const bodyY = Math.round(this.bodySprite.body.position.y);
    
        let yOffset = 0;
    
        if (this.isJumping) {
            const progress = Phaser.Math.Clamp(this.jumpTimer / this.jumpDuration, 0, 1);
            yOffset = -Math.sin(progress * Math.PI) * 30;
    
            if (progress >= 1) {
                this.isJumping = false;
                this.jumpTimer = 0;
            }
        }
    
        if (this.bikeSprite) this.bikeSprite.setPosition(bodyX, bodyY + yOffset);
        if (this.riderSprite) this.riderSprite.setPosition(bodyX, bodyY + yOffset);
        if (this.meleeWeaponSprite) this.meleeWeaponSprite.setPosition(bodyX, bodyY + yOffset);
        if (this.rangedWeaponSprite) this.rangedWeaponSprite.setPosition(bodyX, bodyY + yOffset);
    }

    cycleMeleeWeapon(direction = 1) {
        const len = this.meleeWeapons.length;
        if (len <= 1) return;
    
        this.currentMeleeWeaponIndex = (this.currentMeleeWeaponIndex + direction + len) % len;
        this.currentMeleeWeapon = this.meleeWeapons[this.currentMeleeWeaponIndex];
    
        const newKey = this.currentMeleeWeapon.spriteKey;
        this.meleeWeaponSprite.setTexture(newKey);
        this.meleeWeaponSprite.name = newKey;
        // Update damage attributes
        this.meleeDamageMin = this.currentMeleeWeapon.damageMin ?? this.meleeDamageMin;
        this.meleeDamageMax = this.currentMeleeWeapon.damageMax ?? this.meleeDamageMax;

        // this.meleeCooldown = this.currentMeleeWeapon.cooldown ?? this.meleeCooldown;
    
        // Update UI
        if (this.scene.meleeCard) {
            this.scene.meleeCard.updateDisplay(this.currentMeleeWeapon);
        }
    }
    
    cycleRangedWeapon(direction = 1) {
        if (this.isReloading) return;
    
        const len = this.rangedWeapons.length;
        if (len <= 1) return;
    
        this.currentRangedWeaponIndex = (this.currentRangedWeaponIndex + direction + len) % len;
        this.currentRangedWeapon = this.rangedWeapons[this.currentRangedWeaponIndex];
    
        const weapon = this.currentRangedWeapon;
    
        // Update sprite
        this.rangedWeaponSprite.setTexture(weapon.spriteKey);
        this.rangedWeaponSprite.name = weapon.spriteKey;
    
        // Update attributes
        this.rangedDamageMin = weapon.damageMin;
        this.rangedDamageMax = weapon.damageMax;
        this.rangedCooldown = weapon.cooldown;
    
        // Optional: reset reload state on weapon switch
        this.isReloading = false;
    
        // Update UI
        if (this.scene.rangedCard) {
            this.scene.rangedCard.updateDisplay(weapon);
        }
    }

    handleDying(delta) {
        // === Death Drift ===
        if (this.bodySprite?.body) {
            this.bodySprite.setVelocity(0, this.deathDriftSpeed);
            this.updateDisplayPosition(); // keeps display sprites in sync
        } else {
            const drift = (this.deathDriftSpeed);
            this.riderSprite.y += drift;
            this.bikeSprite.y += drift;
            this.meleeWeaponSprite.y += drift;
            this.rangedWeaponSprite.y += drift;
        }
    
        // === Destroy Headlight ===
        if (this.headlight) {
            this.headlight.destroy();
            this.headlight = null;
        }
    
        // === Remove Physics Body When Offscreen ===
        const spriteY = this.riderSprite.y;
        if (spriteY > this.scene.height + 40) {
            this.destroy();
            return;
        } else if (spriteY > this.scene.height - 30 && this.bodySprite?.body) {
            this.scene.matter.world.remove(this.bodySprite.body);
            this.bodySprite.body = null;
        }
    
        // === Play Death Animation Once ===
        if (!this.deathAnimPlayed) {
            this.scene.soundObj.heroDeath.play();
            this.scene.soundtrackManager.play({ category: "death", loop: true, volume: 0.6 });

            const deathAnimKey = `${this.spriteKey}_${this.bikeSprite.name}_death`;
            const sprites = [
                this.bikeSprite,
                this.riderSprite,
                this.meleeWeaponSprite,
                this.rangedWeaponSprite
            ];
    
            for (const sprite of sprites) {
                if (!sprite?.anims) continue;
                this.playAnimation(`death`, true);
                sprite.once('animationcomplete', (anim) => {
                    if (anim.key === deathAnimKey) {
                        this.playAnimation(`death_loop_used`, true);
                    }
                });
            }
    
            this.deathAnimPlayed = true;
        }
    
        // === Spark Effects ===
        this.deathSparkTimer = (this.deathSparkTimer || 0) + delta;
        this.deathSparkInterval = this.deathSparkInterval ?? 50 + Math.random() * 50;
    
        if (this.deathSparkTimer >= this.deathSparkInterval) {
            this.deathSparkTimer = 0;
            this.deathSparkInterval = 50 + Math.random() * 50;
            const side = Math.random() < 0.5 ? "left" : "right";
            this.spawnMeleeSparks(this.riderSprite.x, this.riderSprite.y, side);
        }
    
        // === Other Death Effects ===
        this.updateSparks(delta);
        this.updateTracers(delta);
        updateRubberMarks(this, delta, { isHero: true });
        updateExhaustClouds(this, delta);
    }
    

    destroy() {
        if (!this.scene.deathMessageSprite) {
            const centerX = this.scene.cameras.main.width / 2;
            const centerY = this.scene.cameras.main.height / 2;
        
            const msg = this.scene.add.sprite(centerX, centerY, 'death_message');
            msg.setScrollFactor(0);
            msg.setDepth(9999); // ensure it's above everything
            msg.setOrigin(0.5, 0.5);
            
            this.scene.deathMessageSprite = msg;
            this.scene.deathMessageSprite.anims.play("death_message_flicker", true);
        }
        // Cancel melee attack delay timer if active
        if (this.meleeAttackDelayTimer) {
            this.meleeAttackDelayTimer.remove(false);
            this.meleeAttackDelayTimer = null;
        }
    
        // Destroy all Matter sensors
        for (const sensor of this.activeMeleeSensors) {
            this.scene.matter.world.remove(sensor);
            this.scene.activeMeleeSensors.delete(sensor);
        }
        this.activeMeleeSensors.length = 0;
    
        // Destroy body
        if (this.bodySprite?.body) {
            this.scene.matter.world.remove(this.bodySprite.body);
        }
        this.bodySprite?.destroy();
    
        // Destroy display sprites
        this.bikeSprite?.destroy();
        this.riderSprite?.destroy();
        this.meleeWeaponSprite?.destroy();
        this.rangedWeaponSprite?.destroy();
    
        // Destroy visual effects
        this.tracers.forEach(t => t?.destroy?.());
        this.rubberMarks.forEach(r => r?.destroy?.());
        this.activeSparks.forEach(s => s?.destroy?.());
        this.exhaustClouds.forEach(e => e?.destroy?.());
    
        // Clear arrays
        this.tracers.length = 0;
        this.rubberMarks.length = 0;
        this.activeSparks.length = 0;
        this.exhaustClouds.length = 0;

    }
    
    update(time, delta) {
        if (this.isDead) {
            this.handleDying(delta);
            return;
        }
        
        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer -= delta;
        }

        if (this.isJumping) {
            this.handleJump(delta);
        }

        this.inputCheck();
        this.move(delta);
        this.updateDisplayPosition();
        this.updateDepth();
        this.animate(delta);
        this.updateMeleeSensors();
        
        this.updateTracers(delta);
        this.updateSparks(delta);
        updateRubberMarks(this, delta, { isHero: true });

        if (this.dashCooldown) {
            this.dashCooldownElapsed += delta;
            if (this.dashCooldownElapsed >= this.dashCooldownDuration) {
                this.dashCooldown = false;
                this.dashCooldownElapsed = 0;
            }
        }

        if (this.health <= this.exhaustThreshold) {
            this.exhaustTimer += delta;
            if (this.exhaustTimer >= this.exhaustInterval) {
                this.exhaustTimer = 0;
                spawnExhaust(this, this.bodySprite.x, this.bodySprite.y);
            }
        }
        updateExhaustClouds(this, delta);

    }
}