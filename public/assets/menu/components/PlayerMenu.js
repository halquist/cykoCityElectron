class BasePanelStub {
    constructor(scene, detailContainer, bounds) {
        this.scene = scene;
        this.detail = detailContainer;
        this.bounds = bounds;

        // placeholder text
        this.label = scene.add.text(0, 0, 'Panel under construction…', {
            fontFamily: 'pixelFont, monospace',
            fontSize: '16px',
            color: '#23ae6a',
            resolution: 30,
            wordWrap: { width: bounds.w }
        });
        this.detail.add(this.label);
    }
    getListItems() { return []; }
    onListSelect(item) { }
    destroy() { this.label?.destroy(); this.detail.removeAll(true); }
}