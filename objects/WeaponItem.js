// =============================================================
// objects/WeaponItem.js - Mathe-Shooter
// A weapon lying on the ground that the player can pick up.
// Despawns automatically after CONSTANTS.WEAPON_DESPAWN_MS (30 s).
// Blinks for the last 5 seconds to warn the player.
//
// Depends on: Phaser 3, CONSTANTS, STRINGS
// =============================================================

class WeaponItem extends Phaser.GameObjects.Container {
  // -----------------------------------------------------------
  // Constructor
  // scene      – owning Phaser scene
  // x, y       – world position (centre of the item sprite)
  // weaponData – a WEAPONS entry (or copy)
  // -----------------------------------------------------------
  constructor(scene, x, y, weaponData) {
    super(scene, x, y);

    this.weaponData  = weaponData;
    this._timer      = null;
    this._blinkTween = null;
    this._floatTween = null;

    this._buildVisual();

    // Register with scene and add a static physics body
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    this.body.setSize(28, 28);

    // Start the despawn timer (and the pre-expiry blink)
    this._startTimer(scene);
  }

  // -----------------------------------------------------------
  // _buildVisual() – create child display objects.
  // -----------------------------------------------------------
  _buildVisual() {
    const scene = this.scene;
    const tier  = this.weaponData ? (this.weaponData.tier || 1) : 1;

    // Tier-coloured glow circle (behind the sprite)
    const color = (CONSTANTS.TIER_COLORS && CONSTANTS.TIER_COLORS[tier]) || 0x44ff44;
    this.glow   = scene.add.circle(0, 0, 15, color, 0.30);

    // Weapon sprite (tier-keyed texture from GraphicsFactory)
    const texKey = 'weapon_item_t' + (tier <= 3 ? tier : 1);
    this.sprite  = scene.add.image(0, 0, texKey);

    // Hint text (shown when player is nearby)
    const weaponName = (STRINGS.WEAPON_NAMES && STRINGS.WEAPON_NAMES[this.weaponData && this.weaponData.id])
                       || (this.weaponData && this.weaponData.id)
                       || '?';
    this.hintText = scene.add.text(
      0, -26,
      'E - ' + weaponName,
      {
        fontSize:        '11px',
        fill:            '#ffffff',
        backgroundColor: '#000000aa',
        padding:         { x: 3, y: 2 },
      }
    ).setOrigin(0.5).setVisible(false);

    // Build container hierarchy (back-to-front)
    this.add([this.glow, this.sprite, this.hintText]);

    // Floating animation – oscillates the entire container
    this._floatTween = scene.tweens.add({
      targets:  this,
      y:        this.y - 8,
      yoyo:     true,
      duration: 800,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  // -----------------------------------------------------------
  // _startTimer() – schedule despawn and pre-expiry blink.
  // -----------------------------------------------------------
  _startTimer(scene) {
    const despawnMs = CONSTANTS.WEAPON_DESPAWN_MS || 30000;
    const blinkAt   = despawnMs - 5000;

    // Main despawn timer
    this._timer = scene.time.addEvent({
      delay:    despawnMs,
      callback: function () {
        if (this.active) this.destroy();
      },
      callbackScope: this,
    });

    // Schedule the blink warning (only if there's enough time left)
    if (blinkAt > 0) {
      scene.time.addEvent({
        delay:    blinkAt,
        callback: function () {
          if (!this.active) return;
          this._blinkTween = scene.tweens.add({
            targets:  this,
            alpha:    { from: 1, to: 0.25 },
            yoyo:     true,
            duration: 280,
            repeat:   -1,
          });
        },
        callbackScope: this,
      });
    }
  }

  // -----------------------------------------------------------
  // showHint() – show or hide the pickup hint text.
  // Called by GameScene proximity checks each frame.
  // -----------------------------------------------------------
  showHint(show) {
    if (!this.hintText || !this.active) return;

    this.hintText.setVisible(show);

    if (show) {
      const weaponName = (STRINGS.WEAPON_NAMES && STRINGS.WEAPON_NAMES[this.weaponData && this.weaponData.id])
                         || (this.weaponData && this.weaponData.id)
                         || '?';
      this.hintText.setText('E - ' + weaponName);
    }
  }

  // -----------------------------------------------------------
  // collect() – called when the player picks up this item.
  // Cancels all timers and removes from scene.
  // -----------------------------------------------------------
  collect() {
    if (this._timer) {
      this._timer.remove(false);
      this._timer = null;
    }
    if (this._blinkTween) {
      this._blinkTween.stop();
      this._blinkTween = null;
    }
    if (this._floatTween) {
      this._floatTween.stop();
      this._floatTween = null;
    }
    this.destroy();
  }
}
