export function applyDamage({
    scene,
    target,
    damageAmount,
    knockback,
    attackerX = null,
    attackerY = null,
    damageType,
    isHero = false,
    multiSprite = false, 
}) {
    if (!target.bodySprite?.body || target.isDead || target.damageCooldownTimer > 0) return;

    target.health -= damageAmount;

    // === Tinting ===
    const tintColor = 0xb31c35;
    const tintSprites = multiSprite
        ? [target.bikeSprite, target.riderSprite, target.meleeWeaponSprite, target.rangedWeaponSprite]
        : [target.displaySprite];

    tintSprites.forEach(sprite => sprite?.setTintFill?.(tintColor));
    setTimeout(() => tintSprites.forEach(sprite => sprite?.clearTint?.()), 70);

    // === SFX ===
    if (damageType === "melee") {
        target.scene.soundObj.pipeImpact1.play();
    } else if (damageType === "projectile") {
        target.scene.soundObj.bulletHit1.play();
    }

    // === Damage Amount Display ===
    const camera = scene.cameras.main;
    const screenX = target.bodySprite.x - camera.scrollX;
    const screenY = target.bodySprite.y - camera.scrollY;
    showDamageAmount(scene, screenX, screenY, damageAmount);

    // === Knockback ===
    if (attackerX !== null && attackerY !== null) {
        const dx = target.bodySprite.x - attackerX;
        const dy = target.bodySprite.y - attackerY;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        target.bodySprite.setVelocity((dx / mag) * knockback, (dy / mag) * knockback);
        target.knockbackTimer = target.knockbackDuration;
    }

    // === Interrupt Attack ===
    if (target.isMeleeAttacking) {
        target.cancelAttack?.();
    }

    // === Death Logic ===
    if (target.health <= 0) {
        target.isDead = true;
        return;
    }

    target.damageCooldownTimer = target.damageCooldown;
}

function showDamageAmount(scene, x, y, damageAmount, type = null) {
    const color = getDamageColor(damageAmount, type);
    const startY = y - 6;

    const damageText = createDamageText(scene, x, startY, damageAmount, color);
    animateDamageText(scene, damageText, startY);
}

function getDamageColor(amount, type) {
    const baseColors = {
        low: "#ffffff",
        medium: "#ff8c00",
        high: "#ff0000",
        critical: "#b800ff"
    };

    const damageColors = {
        fire: "#ff4500",
        poison: "#98fb98",
        piercing: "#ead11e",
        invulnerable: "#00a3ff"
    };

    if (type in damageColors) return damageColors[type];

    if (amount <= 15) return baseColors.low;
    if (amount <= 30) return baseColors.medium;
    if (amount <= 60) return baseColors.high;
    return baseColors.critical;
}

function createDamageText(scene, x, y, amount, color) {
    return scene.add.text(x, y, amount, {
        fontFamily: "pixelFont, sans-serif",
        fontSize: '16px',
        color,
        stroke: '#000000',
        strokeThickness: 1,
        resolution: 30,
        align: 'center',
        origin: { x: 0.5, y: 0.5 }
    })
        .setScrollFactor(0)
        .setOrigin(.5, .5)
        .setDepth(1001);
}

function animateDamageText(scene, damageText, startY) {
    scene.tweens.add({
        targets: damageText,
        y: startY - 16,
        duration: 800,
        ease: 'Power1',
    });

    scene.tweens.add({
        targets: damageText,
        alpha: 0,
        duration: 400,
        delay: 400,
        ease: 'Power1',
        onComplete: () => damageText.destroy()
    });
}
