// =============================================================
// scenes/BootScene.js - Mathe-Shooter
// Generates all textures via GraphicsFactory and starts ProfileScene.
// =============================================================

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Generate all textures programmatically
    GraphicsFactory.createAll(this);

    // Show loading text centred on screen
    this.add.text(480, 270, 'Lädt...', {
      fontSize: '32px',
      fill: '#ffffff',
    }).setOrigin(0.5);
  }

  create() {
    // AudioSystem is lazy-initialised on first user gesture (see game.js)
    this.scene.start('HomeScene');
  }
}
