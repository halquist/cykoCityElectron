export function enterJumpState(instance) {
    if (instance.isJumping || instance.downMove) return;
    instance.isJumping = true;
    instance.jumpTimer = 0;

    instance.canTakeMeleeDamage = false;

    if (instance.tailLightOffsets) {
        instance.frozenTailOffsets = instance.tailLightOffsets.map(o => o.clone());
    }
}

export function handleJump(instance, delta) {
    instance.jumpTimer += delta;

    // Temporary collision category: only world bounds
    instance.bodySprite.setCollidesWith([instance.scene.categoryWorldBounds]);

    // Vertical jump velocity override
    instance.bodySprite.body.velocity.x = 0;
    instance.bodySprite.body.velocity.y = -instance.jumpSpeed;

    // Retain lateral momentum without delta scaling
    instance.bodySprite.setVelocity(
        instance.currentVelocity.x,
        instance.currentVelocity.y
    );

    // End jump after duration
    if (instance.jumpTimer >= instance.jumpDuration) {
        instance.bodySprite.setCollidesWith([
            instance.scene.categoryEnemy,
            instance.scene.categoryObstacle,
            instance.scene.categoryPowerup,
            instance.scene.categoryWorldBounds,
            instance.scene.categoryProjectile,
            instance.scene.categoryExplosion
        ]);

        instance.isJumping = false;
        instance.canTakeMeleeDamage = true;
        instance.jumpTimer = 0;
        instance.frozenTailOffsets = null;

        if (instance.scene.soundObj?.bikeThud1) {
            instance.scene.soundObj.bikeThud1.play();
        }
    }
}

