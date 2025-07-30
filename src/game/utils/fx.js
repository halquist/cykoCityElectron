export function spawnSparks(context, originX, originY, side, getDepthFn) {
    const count = Phaser.Math.Between(6, 10);

    for (let i = 0; i < count; i++) {
        const g = context.scene.add.graphics();
        g.setDepth(getDepthFn());

        const offsetX = side === 'left' ? -8 : 8;
        g.setPosition(originX + offsetX, originY);
        g.fillStyle(0x40afdd, 1);
        g.fillRect(0, 0, 1, 1);

        const angle = Phaser.Math.FloatBetween(-0.8, 0.8);
        const speed = Phaser.Math.FloatBetween(20, 40);
        const vx = Math.cos(angle) * speed * (side === 'right' ? 1 : -1);
        const vy = Math.sin(angle) * 20;

        context.activeSparks.push({
            graphics: g,
            vx,
            vy,
            alpha: 1,
            lifetime: 0.3 + Math.random() * 0.2,
            age: 0,
            color: Phaser.Display.Color.ValueToColor(
                Math.random() < 0.5 ? 0x66ffc8 : 0xffe73a
            ).color,
        });
    }
}

export function updateSparks(context, delta) {
    const sparks = context.activeSparks;

    for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.age += delta / 1000;
        const t = Phaser.Math.Clamp(spark.age / spark.lifetime, 0, 1);

        spark.vy += 50 * (delta / 1000);  // gravity
        spark.graphics.x += spark.vx * (delta / 1000);
        spark.graphics.y += spark.vy * (delta / 1000) + context.scene.scrollSpeed * 0.5 * (delta / 1000);

        spark.alpha = t < 0.8 ? 1 : 1 - ((t - 0.8) / 0.2);

        spark.graphics.clear();
        spark.graphics.fillStyle(spark.color, spark.alpha);
        spark.graphics.fillRect(0, 0, 1, 1);
        spark.graphics.x += Math.sin(spark.age * 30 + i) * 0.05;

        if (spark.age >= spark.lifetime) {
            spark.graphics.destroy();
            sparks.splice(i, 1);
        }
    }
}

export function spawnTracer(context, x, y, spriteY, color) {
    const g = context.scene.add.graphics();
    g.setDepth(spriteY + context.scene.height);
    g.fillStyle(color, 1);
    g.fillRect(x, y, 1, 1);

    context.tracers.push({ x, y, alpha: 1, graphics: g });
}

export function updateTracers(context, delta, {
    getSprite,
    getTargetOffsets,
    shouldEmit,
    tracerColor
}) {
    const baseSpeed = 46;
    const baseInterval = 10;
    const currentSpeed = context.scene.scrollSpeed;
    const adjustedInterval = baseInterval * (baseSpeed / currentSpeed);
    const transitionSpeed = 20;

    const targetOffsets = getTargetOffsets();
    for (let i = 0; i < context.tailLightOffsets.length; i++) {
        context.tailLightOffsets[i].lerp(targetOffsets[i], transitionSpeed * (delta / 1000));
    }

    context.tracerSpacingTimer += delta;

    if (shouldEmit() && context.tracerSpacingTimer >= adjustedInterval) {
        context.tracerSpacingTimer = 0;

        const baseSprite = getSprite();
        for (const offset of context.tailLightOffsets) {
            const x = Math.round(baseSprite.x + offset.x);
            const y = Math.round(baseSprite.y + offset.y);
            spawnTracer(context, x, y, baseSprite.y, tracerColor);
        }
    }

    const deltaSec = delta / 1000;
    const deltaY = context.scene.scrollSpeed * deltaSec;

    for (let i = context.tracers.length - 1; i >= 0; i--) {
        const tracer = context.tracers[i];
        tracer.y += deltaY;
        tracer.alpha -= context.tracerFadeRate * deltaSec;

        if (tracer.alpha <= 0) {
            tracer.graphics.destroy();
            context.tracers.splice(i, 1);
        } else {
            tracer.graphics.clear();
            tracer.graphics.fillStyle(tracerColor, tracer.alpha);
            tracer.graphics.fillRect(tracer.x, tracer.y, 1, 1);
        }
    }
}

export function updateRubberMarks(instance, delta, config = {}) {
    const {
        isHero = false,
        backwardThreshold = 50,
        rubberColor = 0x151515,
    } = config;

    const scrollSpeed = instance.scene.scrollSpeed;
    const canvasHeight = instance.scene.sys.canvas.height;

    // === Detect braking ===
    const isBraking = isHero
        ? instance.downMove && !instance.isJumping
        : instance.currentVelocity.y > backwardThreshold;

    if (isHero) {
        if (instance.downMove) {
            instance.brakeHoldTime += delta;
            if (!instance.scene.soundObj.tireScreech1.isPlaying) {
                instance.scene.soundObj.tireScreech1.play();
            }
        } else {
            instance.brakeHoldTime = 0;
            instance.scene.soundObj.tireScreech1.stop();
        }
    } else {
        instance.brakeHoldTime = isBraking ? instance.brakeHoldTime + delta : 0;
    }

    // === Interval timing ===
    const baseSpeed = 40;
    const baseInterval = 30;
    const adjustedInterval = baseInterval * (baseSpeed / scrollSpeed);

    instance.rubberMarkSpacingTimer += delta;

    if (
        isBraking &&
        instance.rubberMarkSpacingTimer >= adjustedInterval &&
        instance.brakeHoldTime <= instance.brakeMaxMarkDuration
    ) {
        instance.rubberMarkSpacingTimer = 0;

        for (const offset of instance.rubberMarkOffsets) {
            if (Math.random() < 0.2) continue;

            const baseSprite = isHero ? instance.bodySprite : instance.displaySprite;
            const markX = baseSprite.x + offset.x;
            const markY = baseSprite.y + offset.y;
            const markHeight = Phaser.Math.Between(1, 2);

            const g = instance.scene.add.graphics();
            g.setDepth(isHero ? -1 : baseSprite.depth - 1);
            g.fillStyle(rubberColor, 1);
            g.fillRect(markX, markY, 2, markHeight);

            instance.rubberMarks.push({ x: markX, y: markY, height: markHeight, graphics: g });
        }
    }

    // === Move and fade marks ===
    const deltaY = scrollSpeed * (delta / 1000);
    for (let i = instance.rubberMarks.length - 1; i >= 0; i--) {
        const mark = instance.rubberMarks[i];
        mark.y += deltaY;

        if (mark.y > canvasHeight + 4) {
            mark.graphics.destroy();
            instance.rubberMarks.splice(i, 1);
        } else {
            mark.graphics.clear();
            mark.graphics.setDepth(isHero ? -1 : instance.displaySprite.depth - 1);
            mark.graphics.fillStyle(rubberColor, 1);
            mark.graphics.fillRect(mark.x, mark.y, 2, mark.height);
        }
    }
}

export function spawnExhaust(instance, originX, originY, config = {}) {
    const {
        exhaustColor = 0x888888,
        offsetX = [-2, 2],
        offsetY = [4, 6],
        vxRange = [-10, 10],
        vyRange = [50, 80],
        alphaStart = 0.5,
        lifetimeRange = [0.6, 0.8]
    } = config;

    const g = instance.scene.add.graphics();
    const baseDepth = instance.displaySprite?.depth ?? instance.bodySprite?.depth ?? 0;
    g.setDepth(baseDepth - 1);

    if (!instance.exhaustClouds) instance.exhaustClouds = [];

    instance.exhaustClouds.push({
        graphics: g,
        x: originX + Phaser.Math.Between(...offsetX),
        y: originY + Phaser.Math.Between(...offsetY),
        vx: Phaser.Math.FloatBetween(...vxRange),
        vy: Phaser.Math.FloatBetween(...vyRange),
        scale: 1,
        alpha: alphaStart,
        age: 0,
        lifetime: Phaser.Math.FloatBetween(...lifetimeRange),
        color: exhaustColor
    });
}

export function updateExhaustClouds(instance, delta) {
    if (!instance.exhaustClouds) return;

    const dt = delta / 1000;
    const scrollFactor = instance.scene.scrollSpeed / 10;

    for (let i = instance.exhaustClouds.length - 1; i >= 0; i--) {
        const p = instance.exhaustClouds[i];
        p.age += dt;
        const t = p.age / p.lifetime;

        p.alpha = Phaser.Math.Linear(0.5, 0, t);
        p.scale = Phaser.Math.Linear(1, 2.5, t);
        p.x += p.vx * dt;
        p.y += (p.vy + scrollFactor) * dt;

        p.graphics.clear();
        p.graphics.fillStyle(p.color, p.alpha);
        p.graphics.fillRect(p.x, p.y, p.scale, p.scale);

        if (t >= 1) {
            p.graphics.destroy();
            instance.exhaustClouds.splice(i, 1);
        }
    }
}
