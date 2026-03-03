// =============================================================
// objects/ShieldItem.js - Mathe-Shooter
// A shield lying on the ground that the player can pick up.
// Unlike weapon items, shield items do NOT despawn automatically.
//
// Depends on: Phaser 3, STRINGS
// =============================================================

class ShieldItem extends Phaser.GameObjects.Container {
  // -----------------------------------------------------------
  // Constructor
  // scene      – owning Phaser scene
  // x, y       – world position (centre of the item sprite)
  // shieldData – a SHIELDS entry (or copy)
  // -----------------------------------------------------------
  constructor(scene, x, y, shieldData) {
    super(scene, x, y);

    this.shieldData  = shieldData || {};
    this._floatTween = null;

    this._buildVisual();

    // Register with scene and add a static physics body
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    this.body.setSize(28, 28);

    // Floating animation
    this._floatTween = scene.tweens.add({
      targets:  this,
      y:        this.y - 8,
      yoyo:     true,
      duration: 900,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  // -----------------------------------------------------------
  // _buildVisual() – create child display objects.
  // -----------------------------------------------------------
  _buildVisual() {
    const scene = this.scene;

    // Glow circle
    this.glow   = scene.add.circle(0, 0, 15, 0xffcc00, 0.30);

    // Shield sprite
    this.sprite = scene.add.image(0, 0, 'shield_item');

    // Hint text (shown when player is nearby)
    const hintStr = (STRINGS && STRINGS.PICKUP_HINT) || 'E zum Aufheben';
    this.hintText = scene.add.text(
      0, -26,
      hintStr,
      {
        fontSize:        '11px',
        fill:            '#ffffff',
        backgroundColor: '#000000aa',
        padding:         { x: 3, y: 2 },
      }
    ).setOrigin(0.5).setVisible(false);

    // Build container hierarchy (back-to-front)
    this.add([this.glow, this.sprite, this.hintText]);
  }

  // -----------------------------------------------------------
  // showHint() – show or hide the pickup hint text.
  // Called by GameScene proximity checks each frame.
  // -----------------------------------------------------------
  showHint(show) {
    if (this.hintText && this.active) {
      this.hintText.setVisible(show);
    }
  }

  // -----------------------------------------------------------
  // collect() – called when the player picks up this item.
  // Stops tweens and removes from scene.
  // -----------------------------------------------------------
  collect() {
    if (this._floatTween) {
      this._floatTween.stop();
      this._floatTween = null;
    }
    this.destroy();
  }
}
