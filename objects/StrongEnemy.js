// =============================================================
// objects/StrongEnemy.js - Mathe-Shooter
// Tougher patrol enemy that also fires projectiles at the player.
// Extends: Enemy
// Depends on: Enemy.js, BulletPool, AudioSystem, CONSTANTS
// =============================================================

class StrongEnemy extends Enemy {
  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------
  constructor(scene, x, y) {
    super(scene, x, y, 'strong_enemy');

    // Override base stats
    this.hp      = 5;
    this.maxHp   = 5;
    this.points  = 30;
    this.speed   = 100;

    // Size the display and physics body
    this.setDisplaySize(40, 40);
    this.body.setSize(34, 36);

    // Ranged-attack state
    this._lastShot     = 0;
    this._shotInterval = 3000; // ms between shots
    this._aggroRange   = 400;  // px: distance at which it will shoot

    // Refresh HP bar now that size is final
    this._updateHPBar();
  }

  // -----------------------------------------------------------
  // update() – called each frame from GameScene.
  //
  // time        – current timestamp (ms)
  // delta       – frame delta (ms)
  // platforms   – StaticGroup (for patrol edge detection)
  // worldBounds – right edge of world in pixels
  // playerX     – player X world position
  // playerY     – player Y world position
  // bulletPool  – BulletPool singleton (may be null)
  // -----------------------------------------------------------
  update(time, delta, platforms, worldBounds, playerX, playerY, bulletPool) {
    if (!this.isAlive || !this.active) return;

    // Standard left-right patrol
    this.patrol(platforms, worldBounds);

    // Ranged attack: fire at the player if in range and cooldown expired
    if (bulletPool && typeof playerX === 'number' && typeof playerY === 'number') {
      const dx   = playerX - this.x;
      const dy   = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this._aggroRange && (time - this._lastShot) > this._shotInterval) {
        this._lastShot = time;
        this._shootAtPlayer(dx, dy, dist, bulletPool);
      }
    }
  }

  // -----------------------------------------------------------
  // _shootAtPlayer() – fire one projectile toward the player.
  // -----------------------------------------------------------
  _shootAtPlayer(dx, dy, dist, bulletPool) {
    if (dist === 0) return; // avoid divide-by-zero

    const normX = dx / dist;
    const normY = dy / dist;

    // Spawn bullet slightly above the enemy centre
    bulletPool.fireEnemy(this.x, this.y - 12, normX, normY, 280);

    // Play shoot SFX if AudioSystem is available
    if (window.AudioSystem && typeof AudioSystem.shoot === 'function') {
      AudioSystem.shoot();
    }
  }
}
