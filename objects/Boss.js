// =============================================================
// objects/Boss.js - Mathe-Shooter
// Level boss with three phases and a fixed-position HP bar.
//
// Phase 1 (HP > 66%): patrol + fire every 4 s (single bullet)
// Phase 2 (HP 33–66%): faster patrol + fire every 2 s (double)
// Phase 3 (HP < 33%): rush player + spray 3 bullets every 1.5 s
//
// Boss is IMMUNE to tier 0 (club) and tier 1 weapons.
// Tier 3 weapons deal double damage.
//
// Depends on: Phaser 3, LEVELS, CONSTANTS, STRINGS, EventBus,
//             AudioSystem, BulletPool, MathSystem, ProfileSystem
// =============================================================

class Boss extends Phaser.Physics.Arcade.Sprite {
  // -----------------------------------------------------------
  // Constructor
  // scene   – owning Phaser scene
  // x, y    – world spawn position
  // levelId – 1-based level number (indexes LEVELS array)
  // -----------------------------------------------------------
  constructor(scene, x, y, levelId) {
    super(scene, x, y, 'boss');

    // Register with scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Pull HP from level config
    const levelIndex  = (levelId || 1) - 1;
    const levelConfig = (window.LEVELS && LEVELS[levelIndex]) || {};
    this.maxHp   = levelConfig.bossHp || 20;
    this.hp      = this.maxHp;
    this.levelId = levelId || 1;

    // Combat state
    this.isAlive   = true;
    this.phase     = 1;
    this.speed     = 60;
    this.direction = -1;
    this.isSlow    = false;

    this._lastShot  = 0;
    this._slowTimer = null;
    this._burnTimer = null;

    // Display size and collision body
    this.setDisplaySize(64, 80);
    this.body.setSize(50, 75);
    this.body.setCollideWorldBounds(true);
    this.body.allowGravity = true;

    // ---- UI overlays ------------------------------------------

    // Full-width HP bar pinned to top of screen (scroll-independent)
    this.hpBar = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(100);
    this._bossLabel = null; // created lazily inside _updateHPBar
    this._updateHPBar();

    // Phase-change text floating above the boss
    this.phaseText = scene.add.text(
      x, y - 56,
      '',
      {
        fontSize:        '14px',
        fill:            '#ff2222',
        stroke:          '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(12);

    // Gold immunity flash ring
    this.immunityFlash = scene.add.circle(x, y, 46, 0xffdd00, 0)
      .setDepth(11);
  }

  // -----------------------------------------------------------
  // takeDamage() – process a hit from the player.
  // weaponData – WEAPONS entry or null (club)
  // -----------------------------------------------------------
  takeDamage(weaponData) {
    if (!this.isAlive) return;

    const tier = weaponData ? (weaponData.tier || 0) : 0;

    // Only the club (tier 0) is completely ineffective.
    // Tier 1 weapons deal normal damage (levels 1-3 have only tier 1 chests).
    if (tier <= 0) {
      this._triggerImmunity();
      if (window.EventBus) EventBus.emit('BOSS_IMMUNE');
      return;
    }

    // Tier 2 = normal damage, Tier 3 = double damage
    const multiplier = (tier === 3) ? 2.0 : 1.0;
    const dmg        = (weaponData.damage || 1) * multiplier;

    this.hp -= dmg;
    this._updateHPBar();
    this._checkPhaseTransition();

    // Hit-flash red
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, function () {
      if (this.active && this.isAlive) this.clearTint();
    }, [], this);

    // Apply weapon effects
    if (weaponData.burnDamage && weaponData.burnDuration) {
      this._applyBurn(weaponData.burnDamage, weaponData.burnDuration);
    }
    if (weaponData.slowDuration) {
      this._applySlow(weaponData.slowDuration);
    }

    if (this.hp <= 0) this._die();
  }

  // -----------------------------------------------------------
  // _triggerImmunity() – visual feedback when boss is immune.
  // -----------------------------------------------------------
  _triggerImmunity() {
    if (!this.immunityFlash) return;

    this.immunityFlash.setAlpha(0.85);
    this.scene.tweens.add({
      targets:  this.immunityFlash,
      alpha:    0,
      duration: 550,
      ease:     'Quad.easeOut',
    });

    // Gold tint on boss body
    this.setTint(0xffdd00);
    this.scene.time.delayedCall(380, function () {
      if (this.active && this.isAlive) this.clearTint();
    }, [], this);
  }

  // -----------------------------------------------------------
  // _applyBurn() – periodic burn damage over time.
  // -----------------------------------------------------------
  _applyBurn(dps, duration) {
    if (this._burnTimer !== null) {
      clearInterval(this._burnTimer);
      this._burnTimer = null;
    }
    const intervalMs = 500;
    const ticks      = Math.ceil(duration / intervalMs);
    const dmgPerTick = dps * (intervalMs / 1000);
    let   count      = 0;

    this._burnTimer = setInterval(() => {
      count++;
      if (!this.active || !this.isAlive || count > ticks) {
        clearInterval(this._burnTimer);
        this._burnTimer = null;
        return;
      }
      this.hp -= dmgPerTick;
      this._updateHPBar();
      this._checkPhaseTransition();
      if (this.hp <= 0) {
        clearInterval(this._burnTimer);
        this._burnTimer = null;
        this._die();
      }
    }, intervalMs);
  }

  // -----------------------------------------------------------
  // _applySlow() – halve movement speed for a duration.
  // -----------------------------------------------------------
  _applySlow(duration) {
    this.isSlow = true;
    if (this._slowTimer !== null) clearTimeout(this._slowTimer);
    this._slowTimer = setTimeout(() => {
      this.isSlow     = false;
      this._slowTimer = null;
    }, duration);
  }

  // -----------------------------------------------------------
  // _checkPhaseTransition() – update phase based on current HP%.
  // -----------------------------------------------------------
  _checkPhaseTransition() {
    const ratio    = this.hp / this.maxHp;
    let newPhase   = 1;
    if      (ratio <= 0.33) newPhase = 3;
    else if (ratio <= 0.66) newPhase = 2;

    if (newPhase !== this.phase) {
      this.phase = newPhase;

      const msgs = {
        2: (STRINGS && STRINGS.BOSS_PHASE2) || 'Der Boss wird wütend!',
        3: (STRINGS && STRINGS.BOSS_PHASE3) || 'ACHTUNG! Boss im Angriff!',
      };
      const msg = msgs[this.phase];
      if (msg) {
        if (this.phaseText) this.phaseText.setText(msg);
        if (window.EventBus) {
          EventBus.emit('BOSS_PHASE_CHANGED', { phase: this.phase, msg: msg });
        }
        // Clear the floating text after 3 seconds
        this.scene.time.delayedCall(3000, function () {
          if (this.phaseText && this.phaseText.active) {
            this.phaseText.setText('');
          }
        }, [], this);
      }
    }
  }

  // -----------------------------------------------------------
  // _updateHPBar() – redraw the fixed on-screen HP bar.
  // Drawn at scroll-factor 0 so it stays anchored to the HUD.
  // -----------------------------------------------------------
  _updateHPBar() {
    if (!this.hpBar || !this.hpBar.active) return;

    this.hpBar.clear();

    const gameW = (CONSTANTS && CONSTANTS.GAME_WIDTH)  || 960;
    const bw    = 400;
    const bh    = 16;
    const bx    = (gameW - bw) / 2;
    const by    = 10;

    // Dark border
    this.hpBar.fillStyle(0x222222, 1);
    this.hpBar.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

    // Background track
    this.hpBar.fillStyle(0x444444, 1);
    this.hpBar.fillRect(bx, by, bw, bh);

    // HP fill (red)
    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    this.hpBar.fillStyle(0xdd2222, 1);
    this.hpBar.fillRect(bx, by, bw * ratio, bh);

    // Sheen highlight on top of bar
    this.hpBar.fillStyle(0xffffff, 0.18);
    this.hpBar.fillRect(bx, by, bw, Math.ceil(bh / 3));

    // Boss label text (created once)
    if (!this._bossLabel && this.scene) {
      this._bossLabel = this.scene.add.text(
        gameW / 2,
        by + bh / 2,
        'BOSS',
        {
          fontSize:        '11px',
          fill:            '#ffffff',
          stroke:          '#000000',
          strokeThickness: 2,
        }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    }
  }

  // -----------------------------------------------------------
  // update() – main per-frame logic; call from GameScene.update().
  //
  // time        – Phaser game timestamp (ms)
  // delta       – frame delta (ms)
  // playerX     – player world X
  // playerY     – player world Y
  // bulletPool  – BulletPool singleton
  // -----------------------------------------------------------
  update(time, delta, playerX, playerY, bulletPool) {
    if (!this.isAlive || !this.active) return;

    // Keep overlay objects in sync with boss world position
    if (this.immunityFlash) this.immunityFlash.setPosition(this.x, this.y);
    if (this.phaseText)     this.phaseText.setPosition(this.x, this.y - 58);

    const effectiveSpeed = this.isSlow ? this.speed * 0.40 : this.speed;

    switch (this.phase) {
      case 1: this._behaviorPhase1(time, playerX, playerY, bulletPool, effectiveSpeed); break;
      case 2: this._behaviorPhase2(time, playerX, playerY, bulletPool, effectiveSpeed); break;
      case 3: this._behaviorPhase3(time, playerX, playerY, bulletPool, effectiveSpeed); break;
    }

    // Always face the player
    if (typeof playerX === 'number') {
      this.setFlipX(this.x > playerX);
    }
  }

  // -----------------------------------------------------------
  // Phase 1 – patrol + 4-second cooldown single shot.
  // -----------------------------------------------------------
  _behaviorPhase1(time, px, py, bulletPool, speed) {
    // Patrol
    this.body.setVelocityX(this.direction * speed);
    if (this.body.blocked.left)  this.direction =  1;
    if (this.body.blocked.right) this.direction = -1;

    // Shoot every 4 s
    if (bulletPool && (time - this._lastShot) > 4000) {
      this._lastShot = time;
      this._shootAt(px, py, bulletPool, false);
    }
  }

  // -----------------------------------------------------------
  // Phase 2 – faster patrol + 2-second double shot.
  // -----------------------------------------------------------
  _behaviorPhase2(time, px, py, bulletPool, speed) {
    this.body.setVelocityX(this.direction * speed * 1.35);
    if (this.body.blocked.left)  this.direction =  1;
    if (this.body.blocked.right) this.direction = -1;

    if (bulletPool && (time - this._lastShot) > 2000) {
      this._lastShot = time;
      this._shootAt(px, py, bulletPool, true); // true = double shot
    }
  }

  // -----------------------------------------------------------
  // Phase 3 – rush toward player + 3-bullet spread every 1.5 s.
  // -----------------------------------------------------------
  _behaviorPhase3(time, px, py, bulletPool, speed) {
    // Rush
    const dx = typeof px === 'number' ? px - this.x : 0;
    this.body.setVelocityX(Math.sign(dx) * speed * 1.80);

    if (bulletPool && (time - this._lastShot) > 1500) {
      this._lastShot = time;
      this._shootSpread(px, py, bulletPool);
    }
  }

  // -----------------------------------------------------------
  // _shootAt() – fire one (or two) aimed bullets at the player.
  // -----------------------------------------------------------
  _shootAt(px, py, bulletPool, double) {
    const dx   = (typeof px === 'number') ? px - this.x : 1;
    const dy   = (typeof py === 'number') ? py - this.y : 0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    bulletPool.fireBoss
      ? bulletPool.fireBoss(this.x, this.y - 20, nx, ny, 300)
      : bulletPool.fireEnemy(this.x, this.y - 20, nx, ny, 300);

    if (double) {
      bulletPool.fireBoss
        ? bulletPool.fireBoss(this.x - 22, this.y - 20, nx, ny, 300)
        : bulletPool.fireEnemy(this.x - 22, this.y - 20, nx, ny, 300);
    }

    // SFX
    if (window.AudioSystem && typeof AudioSystem.shoot === 'function') {
      AudioSystem.shoot();
    }
  }

  // -----------------------------------------------------------
  // _shootSpread() – fire 3 bullets in a fan toward the player.
  // -----------------------------------------------------------
  _shootSpread(px, py, bulletPool) {
    const dx   = (typeof px === 'number') ? px - this.x : 1;
    const dy   = (typeof py === 'number') ? py - this.y : 0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const bDirX = dx / dist;
    const bDirY = dy / dist;

    const angles = [-22, 0, 22]; // degrees
    angles.forEach(function (angleDeg) {
      const rad   = angleDeg * (Math.PI / 180);
      const cosA  = Math.cos(rad);
      const sinA  = Math.sin(rad);
      // Rotate direction vector
      const rx = bDirX * cosA - bDirY * sinA;
      const ry = bDirX * sinA + bDirY * cosA;

      if (bulletPool.fireBoss) {
        bulletPool.fireBoss(this.x, this.y - 22, rx, ry, 340);
      } else {
        bulletPool.fireEnemy(this.x, this.y - 22, rx, ry, 340);
      }
    }, this);

    if (window.AudioSystem && typeof AudioSystem.shoot === 'function') {
      AudioSystem.shoot();
    }
  }

  // -----------------------------------------------------------
  // _die() – death sequence; emits BOSS_DEFEATED.
  // -----------------------------------------------------------
  _die() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Stop all movement
    if (this.body) this.body.setVelocity(0, 0);

    // Cancel timers
    if (this._burnTimer !== null) { clearInterval(this._burnTimer); this._burnTimer = null; }
    if (this._slowTimer !== null) { clearTimeout(this._slowTimer);  this._slowTimer = null; }

    // Death SFX
    if (window.AudioSystem && typeof AudioSystem.bossDie === 'function') {
      AudioSystem.bossDie();
    }

    // Explosion animation
    this.scene.tweens.add({
      targets:  this,
      alpha:    0,
      scaleX:   2.2,
      scaleY:   2.2,
      duration: 500,
      ease:     'Quad.easeOut',
      onComplete: () => {
        this._destroyOverlays();
        if (this.active) this.destroy();
      },
    });

    // Emit event for GameScene to handle level completion
    if (window.EventBus) {
      EventBus.emit('BOSS_DEFEATED', { levelId: this.levelId });
    }
  }

  // -----------------------------------------------------------
  // _destroyOverlays() – remove UI Graphics objects.
  // -----------------------------------------------------------
  _destroyOverlays() {
    if (this.hpBar         && this.hpBar.active)         { this.hpBar.destroy();         this.hpBar         = null; }
    if (this._bossLabel    && this._bossLabel.active)    { this._bossLabel.destroy();    this._bossLabel    = null; }
    if (this.phaseText     && this.phaseText.active)     { this.phaseText.destroy();     this.phaseText     = null; }
    if (this.immunityFlash && this.immunityFlash.active) { this.immunityFlash.destroy(); this.immunityFlash = null; }
  }

  // -----------------------------------------------------------
  // destroy() – guaranteed cleanup even when Phaser destroys
  // the object externally (e.g. scene shutdown).
  // -----------------------------------------------------------
  destroy(fromScene) {
    if (this._burnTimer !== null) { clearInterval(this._burnTimer); this._burnTimer = null; }
    if (this._slowTimer !== null) { clearTimeout(this._slowTimer);  this._slowTimer = null; }
    this._destroyOverlays();
    super.destroy(fromScene);
  }
}
