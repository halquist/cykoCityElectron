export default class RoadManager {
    constructor(scene, levelConfig) {
        this.scene = scene;
        this.levelConfig = levelConfig;
        this.tilesetKey = levelConfig.tilesetKey;
        this.tilesetImageKey = levelConfig.tilesetImageKey;

        this.currentRegion = levelConfig.defaultRegion;
        this.regions = levelConfig.regions;
        this.transitions = levelConfig.transitions || {};
        this.sectionIndex = 0;
        this.isSequential = false;

        this.tilesetCache = {};
        this.activeSections = [];

        this.init();
    }

    init() {
        this.scrollY = 0;
    
        const firstKey = this.getNextSectionKey();
        if (!firstKey) return;
    
        const firstSection = this.loadNextSection(0, firstKey);
        if (!firstSection) return;
    
        const nextKey = this.getNextSectionKey();
        if (!nextKey) return;
    
        const nextHeight = this.getSectionHeight(nextKey);
        const nextYOffset = firstSection.base.y - nextHeight;
    
        this.loadNextSection(nextYOffset, nextKey);
    }

    setRegion(regionName) {
        if (!this.regions[regionName]) return;
        this.currentRegion = regionName;
        this.sectionIndex = 0;
    }

    handleTrigger(triggerName) {
        const region = this.transitions.atTrigger?.[triggerName];
        if (region && this.regions[region]) {
            this.setRegion(region);
        }
    }

    getNextSectionKey() {
        const region = this.regions[this.currentRegion];
        if (!region || !region.mapSections.length) return null;

        return this.isSequential
            ? region.mapSections[this.sectionIndex++ % region.mapSections.length]
            : Phaser.Utils.Array.GetRandom(region.mapSections);
    }

    loadNextSection(yOffset, sectionKey) {
        if (!sectionKey) return;
    
        const map = this.scene.make.tilemap({ key: sectionKey });
    
        let tileset = this.tilesetCache[sectionKey];
        if (!tileset) {
            tileset = map.addTilesetImage(this.tilesetKey, this.tilesetImageKey, 8, 8);
            this.tilesetCache[sectionKey] = tileset;
        }
    
        const suffix = `_section${this.activeSections.length}`;
    
        const base = map.createLayer('base', tileset, 0, 0);
        const mid = map.createLayer('mid', tileset, 0, 0);
        const overs = map.createLayer('overs', tileset, 0, 0);
    
        if (!base || !mid || !overs) {
            console.warn("Available tilelayer names:", map.layers.map(l => l.name));
            console.error("One or more layers failed to load for section", sectionKey);
            return;
        }
    
        base.name = `base${suffix}`;
        mid.name = `mid${suffix}`;
        overs.name = `overs${suffix}`;
    
        base.setDepth(-801);
        mid.setDepth(-800);
        overs.setDepth(800);
    
        this.scene.matter.world.convertTilemapLayer(mid, {
            addToWorld: true,
            collisionGroup: this.scene.categoryObstacle,
        });
    
        base.y = yOffset;
        mid.y = yOffset;
        overs.y = yOffset;
    
        const height = map.heightInPixels;
        const minX = map?.properties.length ? map.properties.find(p => p.name === 'minX')?.value : null;
        const maxX = map?.properties.length ? map.properties.find(p => p.name === 'maxX')?.value : null;

    
        this.activeSections.unshift({ map, base, mid, overs, height, minX, maxX }); // push at top
        return this.activeSections[0];
    }
    

    update(delta) {
        const scrollSpeed = this.scene.scrollSpeed || 0;
        const deltaY = scrollSpeed * (delta / 1000);
        this.scrollY += deltaY;
    
        // Scroll all layers
        for (const section of this.activeSections) {
            section.base.y += deltaY;
            section.mid.y += deltaY;
            section.overs.y += deltaY;
        }
    
        // Remove section that moved off bottom
        const last = this.activeSections[this.activeSections.length - 1];
        if (last && last.base.y >= this.scene.sys.canvas.height) {
            last.base.destroy();
            last.mid.destroy();
            last.overs.destroy();
            this.activeSections.pop();
        }
    
        // Check if we need to load a new section at the top
        const first = this.activeSections[0];
        if (first && (first.base.y + first.height >= 0)) {
            const nextKey = this.getNextSectionKey();
            if (!nextKey) return;
    
            const nextHeight = this.getSectionHeight(nextKey);
            const nextYOffset = first.base.y - nextHeight;
            this.loadNextSection(nextYOffset, nextKey);
        }
    }
    
    getSectionAtY(y) {
        for (const section of this.activeSections) {
            const top = section.base.y;
            const bottom = section.base.y + section.height;
            if (y >= top && y < bottom) {
                return section;
            }
        }
        return null;
    }

    getSectionHeight(sectionKey) {
        const map = this.scene.make.tilemap({ key: sectionKey, add: false });
        return map.heightInPixels;
    }

    getCurrentObstacleSettings() {
        const region = this.regions[this.currentRegion];
        if (!region) return null;

        return {
            allowedObstacles: region.allowedObstacles || [],
            spawnRateMultiplier: region.obstacleSpawnRateMultiplier || 1.0
        };
    }
}
