// =============================================================
// objects/BasicEnemy.js - Mathe-Shooter
// Standard patrol enemy.  Low HP, no ranged attack.
// Extends: Enemy
// Depends on: Enemy.js (must be loaded first)
// =============================================================

class BasicEnemy extends Enemy {
  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------
  constructor(scene, x, y) {
    super(scene, x, y, 'basic_enemy');

    // Override base stats
    this.hp      = 2;
    this.maxHp   = 2;
    this.points  = 10;
    this.speed   = 80;

    // Size the display and physics body
    this.setDisplaySize(32, 32);
    this.body.setSize(26, 28);

    // Refresh HP bar now that size is final
    this._updateHPBar();
  }

  // -----------------------------------------------------------
  // update() – called each frame from GameScene.
  //
  // time        – current timestamp (ms)
  // delta       – frame delta (ms)
  // platforms   – StaticGroup (for future edge detection)
  // worldBounds – right edge of world in pixels
  // playerX     – player X position (unused for basic; kept for API uniformity)
  // -----------------------------------------------------------
  update(time, delta, platforms, worldBounds, playerX) {
    if (!this.isAlive || !this.active) return;
    this.patrol(platforms, worldBounds);
  }
}
