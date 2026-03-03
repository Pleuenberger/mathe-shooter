// =============================================================
// objects/Checkpoint.js - Mathe-Shooter
// Flag checkpoint – activates when the player touches it and
// turns the flag green.  Uses pre-generated textures from
// GraphicsFactory ('checkpoint_inactive', 'checkpoint_active').
// Depends on: Phaser 3, STRINGS (for potential hint text)
// =============================================================

class Checkpoint extends Phaser.GameObjects.Container {
  // -----------------------------------------------------------
  // Constructor
  // scene  – the owning Phaser scene
  // x, y   – world position (centre-bottom of the flagpole)
  // -----------------------------------------------------------
  constructor(scene, x, y) {
    super(scene, x, y);

    this.activated   = false;
    this._waveAnim   = null;

    this._buildVisual();

    // Add to scene display list and physics world
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    // Collision box: narrow pole width, full pole height
    // Body offset is relative to the container origin (x, y)
    this.body.setSize(20, 60).setOffset(-10, -60);
    this.body.immovable    = true;
    this.body.allowGravity = false;
  }

  // -----------------------------------------------------------
  // Build sprite-based visual using pre-made textures.
  // Falls back to a simple Graphics shape if the textures are
  // not yet available (e.g. unit test context).
  // -----------------------------------------------------------
  _buildVisual() {
    const scene = this.scene;

    if (scene.textures.exists('checkpoint_inactive')) {
      // Use the pre-rendered texture from GraphicsFactory
      this.spriteInactive = scene.add.image(0, -24, 'checkpoint_inactive');
      this.spriteActive   = scene.add.image(0, -24, 'checkpoint_active').setVisible(false);
      this.add([this.spriteInactive, this.spriteActive]);
    } else {
      // Fallback: plain Graphics (development / test environments)
      const pole = scene.add.rectangle(0, -30, 6, 60, 0x888888);

      this.flag = scene.add.triangle(3, -40, 0, 0, 25, 10, 0, 20, 0xaaaaaa);
      this.add([pole, this.flag]);
    }
  }

  // -----------------------------------------------------------
  // activate() – called when the player overlaps this checkpoint.
  // Safe to call multiple times (early-return if already active).
  // -----------------------------------------------------------
  activate() {
    if (this.activated) return;
    this.activated = true;

    // Swap to the active (green flag) texture
    if (this.spriteInactive) {
      this.spriteInactive.setVisible(false);
    }
    if (this.spriteActive) {
      this.spriteActive.setVisible(true);
      // Gentle wave animation on the whole container
      this._waveAnim = this.scene.tweens.add({
        targets:  this.spriteActive,
        scaleX:   { from: 1, to: 0.85 },
        yoyo:     true,
        duration: 250,
        repeat:   4,
        ease:     'Sine.easeInOut',
      });
    } else if (this.flag) {
      // Fallback path
      this.flag.setFillStyle(0x00cc00);
      this._waveAnim = this.scene.tweens.add({
        targets:  this.flag,
        scaleX:   { from: 1, to: 0.8 },
        yoyo:     true,
        duration: 300,
        repeat:   3,
      });
    }

    // Small upward bounce on the whole container
    this.scene.tweens.add({
      targets:  this,
      y:        this.y - 6,
      duration: 120,
      yoyo:     true,
      ease:     'Quad.easeOut',
    });
  }

  // -----------------------------------------------------------
  // Convenience getter – returns the world y at the base of the
  // pole so the player can be re-spawned just above the ground.
  // -----------------------------------------------------------
  get spawnY() {
    return this.y;
  }
}
