import enemyClass from "../components/enemyClass.js";

const createCollisionListeners = (scene) => {
    scene.matter.world.on('collisionstart', (event) => {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            if (!bodyA || !bodyB) return;
    
            const entities = [bodyA, bodyB].map(body => ({
                body,
                go: body?.gameObject,
                ref: body?.gameObject?.parentRef,
                isProjectile: body?.label === 'projectile',
                isExplosionSensor: body?.label === 'explosionSensor',
                isRampSensor: body?.label === 'rampSensor',
                isSensor: body?.isSensor,
                isHero: body?.gameObject?.parentRef?.type === 'hero',
                isEnemy: body?.gameObject?.parentRef?.type === 'enemy',
            }));
    
            // === Utility Functions ===
            function tryDealDamage(target, dmg, knockback, x, y, sourceType) {
                if (typeof target?.takeDamage === 'function') {
                    target.takeDamage(dmg, knockback, x, y, sourceType);
                }
            }
    
            function maybeTriggerExplosion(ref) {
                if (ref?.isExplosive && !ref.hasExploded) {
                    ref.triggerExplosion?.();
                }
            }
    
            function playFallenAnimation(obstacle, scene) {
                scene.time.delayedCall(200, () => {
                    if (!scene?.sys || obstacle._destroyed || obstacle.hasExploded || !obstacle.body) return;
                    obstacle.anims?.play(`${obstacle.texture.key}_fallen`, true);
                    obstacle.setCollidesWith?.([scene.categoryObstacle]);
                });
            }
    
            // === 1. HERO DASH DAMAGE ===
            const hero = entities.find(e => e.isHero)?.ref;
            const enemy = entities.find(e => e.isEnemy)?.ref;
            if (hero?.dealDashDamage && enemy) {
                tryDealDamage(enemy, hero.dashDamage, hero.dashKnockback, hero.bodySprite?.x ?? 0, hero.bodySprite?.y ?? 0, 'dash');
            }
    
            // === 2. MELEE SENSOR DAMAGE ===
            const sensorEntity = entities.find(e => e.isSensor && scene.activeMeleeSensors.has(e.body));
            const targetEntity = entities.find(e => e.body !== sensorEntity?.body && e.ref);
            if (sensorEntity && targetEntity) {
                const attacker = scene.activeMeleeSensors.get(sensorEntity.body);
                const target = targetEntity.ref;
                if (attacker && attacker !== target) {
                    const dmg = Phaser.Math.Between(attacker.meleeDamageMin, attacker.meleeDamageMax);
                    const knockback = attacker.meleeKnockback;
                    tryDealDamage(target, dmg, knockback, attacker.bodySprite?.x ?? 0, attacker.bodySprite?.y ?? 0, 'melee');
                }
            }
    
            // === 3. DEAD BODY BOUNCE DAMAGE ===
            const [aRef, bRef] = entities.map(e => e.ref);
            if (aRef instanceof enemyClass && bRef instanceof enemyClass) {
                if (aRef.isDead && !bRef.isDead) {
                    tryDealDamage(bRef, 20, 0, aRef.bodySprite?.x ?? 0, aRef.bodySprite?.y ?? 0, 'collision');
                } else if (bRef.isDead && !aRef.isDead) {
                    tryDealDamage(aRef, 20, 0, bRef.bodySprite?.x ?? 0, bRef.bodySprite?.y ?? 0, 'collision');
                }
            }
    
            // === 4. PROJECTILE COLLISION ===
            const projectileEntity = entities.find(e => e.isProjectile);
            const targetEntityP = entities.find(e => e !== projectileEntity && e.ref);
            if (projectileEntity) {
                const projectile = scene.projectiles.find(p => p.body === projectileEntity.body);
                if (!projectile || !projectile.body || !projectile.body.position) return;
    
                const owner = projectile.owner;
                if (!owner) return;
    
                const targetRef = targetEntityP?.ref;
                const targetGO = targetEntityP?.go;
    
                if (!targetRef) {
                    projectile.destroy();
                    scene.soundObj.bulletImpactEnv1.play();
                    return;
                }
    
                if (targetRef.isExplosive && !targetRef.hasExploded) {
                    maybeTriggerExplosion(targetRef);
                    projectile.destroy();
                    return;
                }
    
                if (targetRef.moveable && !targetRef.hasCollided) {
                    const vx = (projectile.body.velocity.x || 0) * 0.5;
                    const vy = (projectile.body.velocity.y || 0) * 0.5;
                    targetRef.setVelocity?.(vx, vy);
                    targetRef.hasCollided = true;
                    playFallenAnimation(targetRef, scene);
                    scene.soundObj.bulletImpactEnv1.play();
                    projectile.destroy();
                    return;
                }
    
                const isEnemyProjectile = owner.type === 'enemy';
                const isHeroProjectile = owner.type === 'hero';
                const projX = projectile.body.position.x;
                const projY = projectile.body.position.y;
    
                if (isEnemyProjectile && targetRef.type === 'hero') {
                    const dmg = Phaser.Math.Between(owner.rangedDamageMin, owner.rangedDamageMax);
                    tryDealDamage(targetRef, dmg, projectile.knockback, projX, projY, 'projectile');
                    projectile.destroy();
                    return;
                } else if (isHeroProjectile && targetRef.type === 'enemy') {
                    const dmg = Phaser.Math.Between(owner.rangedDamageMin, owner.rangedDamageMax);
                    tryDealDamage(targetRef, dmg, projectile.knockback, projX, projY, 'projectile');
                    projectile.destroy();
                    return;
                }
    
                // fallback: obstacle hit
                if (targetGO?.getData?.('type') === 'obstacle') {
                    projectile.destroy();
                    scene.soundObj.bulletImpactEnv1.play();
                }
            }
    
            // === 5. RAMP JUMP TRIGGER ===
            const rampGO = entities.find(e => e.go?.getData('type') === 'ramp')?.go;
            const heroBody = entities.find(e => e.isHero)?.body;
            const rampSensor = entities.find(e => e.body !== heroBody && e.isRampSensor)?.body;
            if (rampGO && heroBody && rampSensor) {
                rampGO.tryTriggerJump(heroBody);
            }
    
            // === 6. EXPLOSIVE OBSTACLE COLLISION ===
            entities.forEach(obEntity => {
                const ob = obEntity.ref;
                if (!ob?.isExplosive || ob.hasExploded) return;
    
                const otherBody = entities.find(e => e.ref !== ob)?.body;
                const isProjectile = otherBody?.label === 'projectile';
                const isMeleeSensor = otherBody?.isSensor && scene.activeMeleeSensors.has(otherBody);
    
                if (isProjectile || isMeleeSensor) {
                    maybeTriggerExplosion(ob);
                }
            });
    
            // === 7. EXPLOSION SENSOR DAMAGE ===
            const explosionSensor = entities.find(e => e.isExplosionSensor)?.body;
            const explosionTarget = entities.find(e => e.body !== explosionSensor && e.ref)?.ref;
            if (explosionSensor && explosionTarget) {
                let x = 0, y = 0;

                if (explosionSensor?.position) {
                    x = explosionSensor.position.x;
                    y = explosionSensor.position.y;
                } else if (explosionTarget?.displaySprite) {
                    x = explosionTarget.displaySprite.x;
                    y = explosionTarget.displaySprite.y;
                }
                tryDealDamage(explosionTarget, explosionSensor?.damage ?? 0, explosionSensor?.knockback ?? 0, x, y, 'explosion');
            }
    
            // === 8. OBSTACLE MOVEMENT + FALLEN ANIMATION ===
            entities.forEach(entity => {
                const obstacle = entity.ref;
                if (!obstacle || !obstacle.moveable || obstacle.hasCollided) return;
    
                const otherBody = entities.find(e => e.body !== entity.body)?.body;
                const v = otherBody?.velocity || { x: 0, y: 0 };
                const magnitude = Math.sqrt(v.x * v.x + v.y * v.y);
                if (magnitude > 0) {
                    const scale = 2;
                    const vx = (v.x / magnitude) * scale;
                    const vy = (v.y / magnitude) * scale;
                    obstacle.setVelocity?.(vx, vy);
                }
    
                obstacle.hasCollided = true;
                playFallenAnimation(obstacle, scene);
            });
        });
    });

    scene.matter.world.on('worldbounds', (body) => {
        const proj = body?.gameObject;
        if (proj?.destroyProjectile) {
            proj.destroyProjectile();
        }
    });
};

export default createCollisionListeners;
