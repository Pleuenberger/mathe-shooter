// =============================================================
// objects/MathChest.js - Mathe-Shooter
// A treasure chest that triggers a math challenge when the player
// presses E nearby.  Chests exist in three difficulty categories.
//
// Depends on: Phaser 3, STRINGS, EventBus
// =============================================================

class MathChest extends Phaser.GameObjects.Container {
  // -----------------------------------------------------------
  // Constructor
  // scene    – owning Phaser scene
  // x, y     – world position (centre of chest sprite)
  // category – 'easy' | 'medium' | 'hard'
  // -----------------------------------------------------------
  constructor(scene, x, y, category) {
    super(scene, x, y);

    this.category    = category || 'easy';
    this.opened      = false;
    this.isNearPlayer = false;

    this._pulseAnim  = null;
    this._bounceTween = null;

    this._buildVisual();

    // Register with scene and add a static physics body
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    this.body.setSize(40, 40).setOffset(-20, -20);

    // Hint text (shown when player is nearby)
    const hintStr = (STRINGS && STRINGS.CHEST_OPEN_HINT) || 'E zum Öffnen';
    this.hintText = scene.add.text(
      0, -36,
      hintStr,
      {
        fontSize:        '12px',
        fill:            '#ffffff',
        backgroundColor: '#000000cc',
        padding:         { x: 4, y: 2 },
      }
    ).setOrigin(0.5).setVisible(false);

    this.add(this.hintText);
  }

  // -----------------------------------------------------------
  // _buildVisual() – create the chest sprite and glow.
  // -----------------------------------------------------------
  _buildVisual() {
    const scene = this.scene;

    // Per-category glow colour
    const glowColors = {
      easy:   0x44ff44,
      medium: 0x4488ff,
      hard:   0xaa44ff,
    };
    const glowColor = glowColors[this.category] || 0xffffff;

    // Glow disc behind the sprite
    this.glow = scene.add.circle(0, 5, 23, glowColor, 0.20);

    // Chest sprite (closed variant)
    const texKey = 'chest_' + this.category;
    this.sprite  = scene.add.image(0, 0, texKey);

    // Container order: glow first (behind), then sprite
    this.add([this.glow, this.sprite]);

    // Idle pulse on the glow
    this._pulseAnim = scene.tweens.add({
      targets:  this.glow,
      alpha:    { from: 0.20, to: 0.50 },
      yoyo:     true,
      duration: 1000,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  // -----------------------------------------------------------
  // setNearPlayer() – called each frame from GameScene.
  // Toggles the hint text and plays a subtle scale bounce.
  // -----------------------------------------------------------
  setNearPlayer(near) {
    if (near === this.isNearPlayer) return;
    this.isNearPlayer = near;

    if (this.hintText) {
      this.hintText.setVisible(near && !this.opened);
    }

    if (near && !this.opened && !this._bounceTween) {
      this._bounceTween = this.scene.tweens.add({
        targets:  this.sprite,
        scaleX:   1.06,
        scaleY:   1.06,
        duration: 180,
        yoyo:     true,
        ease:     'Quad.easeOut',
        onComplete: () => { this._bounceTween = null; },
      });
    }
  }

  // -----------------------------------------------------------
  // open() – switch to the open sprite and stop animations.
  // Returns true on the first call, false if already opened.
  // -----------------------------------------------------------
  open() {
    if (this.opened) return false;
    this.opened = true;

    // Hide hint
    if (this.hintText) {
      this.hintText.setVisible(false);
    }

    // Swap to open texture
    if (this.sprite && this.scene.textures.exists('chest_open')) {
      this.sprite.setTexture('chest_open');
    }

    // Dim the glow
    if (this.glow) {
      this.glow.setAlpha(0.08);
    }

    // Stop idle pulse
    if (this._pulseAnim) {
      this._pulseAnim.stop();
      this._pulseAnim = null;
    }

    // Short open-lid pop animation
    this.scene.tweens.add({
      targets:  this.sprite,
      scaleY:   { from: 1, to: 1.12 },
      duration: 120,
      yoyo:     true,
      ease:     'Quad.easeOut',
    });

    return true;
  }

  // -----------------------------------------------------------
  // getCategoryLabel() – localised display string.
  // -----------------------------------------------------------
  getCategoryLabel() {
    if (!STRINGS) return this.category;
    const labels = {
      easy:   STRINGS.CHEST_CATEGORY_EASY   || 'Leicht',
      medium: STRINGS.CHEST_CATEGORY_MEDIUM || 'Mittel',
      hard:   STRINGS.CHEST_CATEGORY_HARD   || 'Schwer',
    };
    return labels[this.category] || this.category;
  }
}
