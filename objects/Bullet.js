// =============================================================
// objects/Bullet.js - Mathe-Shooter
// Projectile class + BulletPool singleton.
//
// Bullet extends Phaser.Physics.Arcade.Sprite and is managed via
// an object-pool (Phaser Group with maxSize).  Never instantiate
// Bullet directly – always use BulletPool.fire() / .fireEnemy().
// (Must be Sprite, not Image, so that super.preUpdate() exists.)
//
// Depends on: Phaser 3 arcade physics, AudioSystem (optional)
// =============================================================

class Bullet extends Phaser.Physics.Arcade.Sprite {
  // -----------------------------------------------------------
  // Constructor – called once per pool slot at group creation.
  // The bullet starts inactive/invisible; fire() activates it.
  // -----------------------------------------------------------
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');

    this.setActive(false).setVisible(false);

    /** Damage dealt on hit. */
    this.damage       = 1;
    /** Reference to the weapon definition that fired this bullet, or null. */
    this.weaponData   = null;
    /** True when this bullet was shot by an enemy / boss. */
    this.isEnemyBullet = false;
    /** Timer handle for the burn-damage interval (setInterval id). */
    this._burnTimer   = null;
  }

  // -----------------------------------------------------------
  // fire() – activate for a PLAYER bullet.
  //
  // x, y        – world spawn position
  // dirX        – horizontal direction (-1 left, +1 right)
  // speed       – pixels per second
  // weaponData  – WEAPONS entry (or copy) for the firing weapon
  // textureKey  – optional override (default 'bullet')
  // -----------------------------------------------------------
  fire(x, y, dirX, speed, weaponData, textureKey) {
    textureKey = textureKey || 'bullet';

    this.setActive(true).setVisible(true);
    this.setTexture(textureKey);
    this.setPosition(x, y);
    this.setScale(1);
    this.setAlpha(1);
    this.setAngle(0);

    if (this.body) {
      this.body.reset(x, y);
      this.body.setVelocity(dirX * speed, 0);
      this.body.allowGravity = false;
    }

    this.weaponData    = weaponData || null;
    this.damage        = weaponData ? (weaponData.damage || 1) : 1;
    this.isEnemyBullet = false;

    // Clear any leftover burn timer from a previous use
    if (this._burnTimer !== null) {
      clearInterval(this._burnTimer);
      this._burnTimer = null;
    }
  }

  // -----------------------------------------------------------
  // fireEnemy() – activate for an ENEMY or BOSS bullet.
  //
  // x, y          – world spawn position
  // dirX, dirY    – normalised direction vector
  // speed         – pixels per second
  // textureOverride – optional texture key (default 'enemy_bullet')
  // -----------------------------------------------------------
  fireEnemy(x, y, dirX, dirY, speed, textureOverride) {
    const texKey = textureOverride || 'enemy_bullet';

    this.setActive(true).setVisible(true);
    this.setTexture(texKey);
    this.setPosition(x, y);
    this.setScale(1);
    this.setAlpha(1);

    if (this.body) {
      this.body.reset(x, y);
      this.body.setVelocity(dirX * speed, dirY * speed);
      this.body.allowGravity = false;
    }

    this.damage        = CONSTANTS.DAMAGE_STRONG_PROJECTILE;
    this.isEnemyBullet = true;
    this.weaponData    = null;

    if (this._burnTimer !== null) {
      clearInterval(this._burnTimer);
      this._burnTimer = null;
    }
  }

  // -----------------------------------------------------------
  // fireBoss() – larger boss projectile with increased damage.
  // -----------------------------------------------------------
  fireBoss(x, y, dirX, dirY, speed) {
    this.fireEnemy(x, y, dirX, dirY, speed, 'boss_bullet');
    this.damage = CONSTANTS.DAMAGE_BOSS_PROJECTILE;
  }

  // -----------------------------------------------------------
  // preUpdate() – called every frame by the group (runChildUpdate).
  // Deactivates the bullet when it leaves the camera's world view.
  // -----------------------------------------------------------
  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Deactivate once the bullet is well outside the visible area
    const cam = this.scene && this.scene.cameras && this.scene.cameras.main;
    if (cam) {
      const view = cam.worldView;
      const margin = 150;
      if (
        this.x < view.x - margin ||
        this.x > view.right  + margin ||
        this.y < view.y - margin ||
        this.y > view.bottom + margin
      ) {
        this.deactivate();
      }
    }
  }

  // -----------------------------------------------------------
  // deactivate() – return this bullet to the pool.
  // Stops velocity and clears any running timers.
  // -----------------------------------------------------------
  deactivate() {
    this.setActive(false).setVisible(false);

    if (this.body) {
      this.body.setVelocity(0, 0);
      this.body.stop();
    }

    if (this._burnTimer !== null) {
      clearInterval(this._burnTimer);
      this._burnTimer = null;
    }

    this.weaponData    = null;
    this.isEnemyBullet = false;
  }
}

// =============================================================
// BulletPool – singleton that owns a single Phaser Group.
// Must call BulletPool.create(scene) once before using fire().
// =============================================================
window.BulletPool = {
  /** @type {Phaser.Physics.Arcade.Group|null} */
  _group: null,

  // -----------------------------------------------------------
  // create() – call once in GameScene.create() to build the pool.
  // Returns the internal group for physics collider registration.
  // -----------------------------------------------------------
  create(scene) {
    this._group = scene.physics.add.group({
      classType:      Bullet,
      maxSize:        60,
      runChildUpdate: true,
      active:         false,
      visible:        false,
    });
    return this._group;
  },

  // -----------------------------------------------------------
  // fire() – fire a player bullet.
  // Returns the Bullet instance, or null if the pool is full.
  // -----------------------------------------------------------
  fire(x, y, dirX, speed, weaponData) {
    if (!this._group) return null;

    const bullet = this._group.get(x, y, 'bullet');
    if (bullet) {
      bullet.fire(x, y, dirX, speed, weaponData);
    }
    return bullet || null;
  },

  // -----------------------------------------------------------
  // fireDouble() – fire two vertically-offset player bullets.
  // Used by the double_shot weapon.
  // -----------------------------------------------------------
  fireDouble(x, y, dirX, speed, weaponData) {
    if (!this._group) return;
    const offsets = [-6, 6];
    offsets.forEach(function (oy) {
      const bullet = this._group.get(x, y + oy, 'bullet');
      if (bullet) {
        bullet.fire(x, y + oy, dirX, speed, weaponData);
      }
    }, this);
  },

  // -----------------------------------------------------------
  // fireEnemy() – fire an enemy projectile.
  // Returns the Bullet instance, or null if the pool is full.
  // -----------------------------------------------------------
  fireEnemy(x, y, dirX, dirY, speed) {
    if (!this._group) return null;

    const bullet = this._group.get(x, y, 'enemy_bullet');
    if (bullet) {
      bullet.fireEnemy(x, y, dirX, dirY, speed);
    }
    return bullet || null;
  },

  // -----------------------------------------------------------
  // fireBoss() – fire a boss projectile.
  // -----------------------------------------------------------
  fireBoss(x, y, dirX, dirY, speed) {
    if (!this._group) return null;

    const bullet = this._group.get(x, y, 'boss_bullet');
    if (bullet) {
      bullet.fireBoss(x, y, dirX, dirY, speed);
    }
    return bullet || null;
  },

  // -----------------------------------------------------------
  // getGroup() – returns the Phaser Group for collider setup.
  // -----------------------------------------------------------
  getGroup() {
    return this._group;
  },

  // -----------------------------------------------------------
  // reset() – deactivate every bullet (e.g. on scene restart).
  // -----------------------------------------------------------
  reset() {
    if (!this._group) return;
    this._group.getChildren().forEach(function (b) {
      if (b.active) b.deactivate();
    });
  },
};
