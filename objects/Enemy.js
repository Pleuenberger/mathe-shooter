// =============================================================
// objects/Enemy.js - Mathe-Shooter
// Base enemy class. BasicEnemy and StrongEnemy extend this.
//
// Depends on: Phaser 3 arcade physics, EventBus, AudioSystem
// =============================================================

class Enemy extends Phaser.Physics.Arcade.Sprite {
  // -----------------------------------------------------------
  // Constructor
  // scene   – owning Phaser scene
  // x, y    – world spawn position
  // texture – texture key registered in GraphicsFactory
  // -----------------------------------------------------------
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture || 'basic_enemy');

    // Register with scene display list and physics world
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ---- Base stats (overridden by subclasses) ----------------
    this.hp      = 2;
    this.maxHp   = 2;
    this.points  = 10;
    this.speed   = 80;

    /** 1 = facing/moving right, -1 = facing/moving left */
    this.direction  = 1;
    this.isAlive    = true;
    this.isSlow     = false;

    // Internal timer handles
    this._slowTimer   = null;
    this._burnTimerId = null;

    // Physics setup
    this.body.setCollideWorldBounds(false);
    this.body.allowGravity = true;

    // HP bar Graphics object (world-space, updated each frame)
    this.hpBar = scene.add.graphics();
    this._updateHPBar();
  }

  // -----------------------------------------------------------
  // takeDamage() – apply damage from a player bullet.
  // amount     – raw damage value
  // weaponData – WEAPONS entry (or copy) for special effects
  // -----------------------------------------------------------
  takeDamage(amount, weaponData) {
    if (!this.isAlive) return;

    let dmg = (typeof amount === 'number' && amount > 0) ? amount : 1;

    // Apply special weapon effects
    if (weaponData) {
      if (weaponData.burnDamage && weaponData.burnDuration) {
        this._applyBurn(weaponData.burnDamage, weaponData.burnDuration);
      }
      if (weaponData.slowDuration) {
        this._applySlow(weaponData.slowDuration);
      }
      if (weaponData.knockback) {
        this._applyKnockback(weaponData.knockback);
      }
    }

    this.hp -= dmg;
    this._updateHPBar();

    // Hit-flash: turn red for 150 ms
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, function () {
      if (this.active && this.isAlive) {
        // Restore slow tint if still slowed, otherwise clear
        if (this.isSlow) {
          this.setTint(0x88aaff);
        } else {
          this.clearTint();
        }
      }
    }, [], this);

    if (this.hp <= 0) {
      this.die();
    }
  }

  // -----------------------------------------------------------
  // _applyBurn() – periodic burn damage over time.
  // dps      – damage per second
  // duration – total duration in ms
  // -----------------------------------------------------------
  _applyBurn(dps, duration) {
    // Cancel any existing burn
    if (this._burnTimerId !== null) {
      clearInterval(this._burnTimerId);
      this._burnTimerId = null;
    }

    const intervalMs = 500;
    const ticks      = Math.ceil(duration / intervalMs);
    const dmgPerTick = dps * (intervalMs / 1000);
    let   count      = 0;

    this._burnTimerId = setInterval(() => {
      count++;
      if (!this.active || !this.isAlive || count > ticks) {
        clearInterval(this._burnTimerId);
        this._burnTimerId = null;
        return;
      }
      this.hp -= dmgPerTick;
      this._updateHPBar();
      if (this.hp <= 0) {
        clearInterval(this._burnTimerId);
        this._burnTimerId = null;
        this.die();
      }
    }, intervalMs);
  }

  // -----------------------------------------------------------
  // _applySlow() – reduce movement speed for a duration.
  // -----------------------------------------------------------
  _applySlow(duration) {
    this.isSlow = true;
    if (!this.active) return;

    // Blue tint while slowed (only if not currently hit-flashing)
    this.setTint(0x88aaff);

    if (this._slowTimer !== null) {
      clearTimeout(this._slowTimer);
    }
    this._slowTimer = setTimeout(() => {
      this.isSlow     = false;
      this._slowTimer = null;
      if (this.active && this.isAlive) {
        this.clearTint();
      }
    }, duration);
  }

  // -----------------------------------------------------------
  // _applyKnockback() – push enemy in the opposite direction.
  // -----------------------------------------------------------
  _applyKnockback(force) {
    if (!this.body) return;
    const knockbackForce = (typeof force === 'number') ? force : 150;
    this.body.setVelocityX(-this.direction * knockbackForce);
  }

  // -----------------------------------------------------------
  // _updateHPBar() – redraw the HP bar above the enemy.
  // Must be called after hp changes and each frame in preUpdate.
  // -----------------------------------------------------------
  _updateHPBar() {
    if (!this.hpBar || !this.hpBar.active) return;

    this.hpBar.clear();

    const barW = 30;
    const barH = 4;
    const bx   = this.x - barW / 2;
    const by   = this.y - (this.displayHeight / 2) - 10;

    // Background track
    this.hpBar.fillStyle(0x333333, 1);
    this.hpBar.fillRect(bx, by, barW, barH);

    // Foreground health fill
    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    let   color;
    if      (ratio > 0.50) color = 0x44ff44; // green
    else if (ratio > 0.25) color = 0xffcc00; // yellow
    else                    color = 0xff4444; // red

    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(bx, by, barW * ratio, barH);
  }

  // -----------------------------------------------------------
  // die() – trigger the death sequence.
  // Emits ENEMY_KILLED via EventBus and destroys the sprite.
  // -----------------------------------------------------------
  die() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Stop all movement immediately
    if (this.body) {
      this.body.setVelocity(0, 0);
    }

    // Clear timers
    if (this._burnTimerId !== null) {
      clearInterval(this._burnTimerId);
      this._burnTimerId = null;
    }
    if (this._slowTimer !== null) {
      clearTimeout(this._slowTimer);
      this._slowTimer = null;
    }

    // Notify listeners (HUD score, etc.)
    if (window.EventBus) {
      EventBus.emit('ENEMY_KILLED', {
        points: this.points,
        x:      this.x,
        y:      this.y,
      });
    }

    // Death animation: fade out and scale up
    this.scene.tweens.add({
      targets:  this,
      alpha:    0,
      scaleX:   1.6,
      scaleY:   1.6,
      duration: 300,
      ease:     'Quad.easeOut',
      onComplete: () => {
        if (this.hpBar && this.hpBar.active) {
          this.hpBar.destroy();
          this.hpBar = null;
        }
        if (this.active) {
          this.destroy();
        }
      },
    });
  }

  // -----------------------------------------------------------
  // patrol() – simple left/right patrol with edge detection.
  // Call from subclass update().
  // platforms   – StaticGroup (unused currently; kept for future edge detection)
  // worldBounds – right edge of the world in pixels
  // -----------------------------------------------------------
  patrol(platforms, worldBounds) {
    if (!this.body || !this.isAlive) return;

    const moveSpeed = this.isSlow ? this.speed * 0.40 : this.speed;
    this.body.setVelocityX(this.direction * moveSpeed);

    // Reverse at world edges or physics walls
    const atLeft  = this.body.blocked.left  || (this.x <= 40);
    const atRight = this.body.blocked.right || (this.x >= (worldBounds || 9999) - 40);

    if (atLeft)  this.direction =  1;
    if (atRight) this.direction = -1;

    // Flip sprite to face the direction of travel
    this.setFlipX(this.direction < 0);
  }

  // -----------------------------------------------------------
  // preUpdate() – called every frame (Phaser arcade lifecycle).
  // Refreshes the HP bar position.
  // -----------------------------------------------------------
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.isAlive && this.active) {
      this._updateHPBar();
    }
  }

  // -----------------------------------------------------------
  // destroy() – clean up Graphics and timers before destroying.
  // -----------------------------------------------------------
  destroy(fromScene) {
    if (this.hpBar && this.hpBar.active) {
      this.hpBar.destroy();
      this.hpBar = null;
    }
    if (this._burnTimerId !== null) {
      clearInterval(this._burnTimerId);
      this._burnTimerId = null;
    }
    if (this._slowTimer !== null) {
      clearTimeout(this._slowTimer);
      this._slowTimer = null;
    }
    super.destroy(fromScene);
  }
}
