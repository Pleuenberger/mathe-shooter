// =============================================================
// objects/Player.js - Mathe-Shooter
// The player character. HP 0-300, up to 3 lives. Keyboard +
// mouse controlled. Depends on: Phaser 3 arcade physics,
// CONSTANTS, ProfileSystem, InventorySystem, BulletPool,
// AudioSystem, EventBus.
// =============================================================

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Choose texture based on active profile colour
    const profile = ProfileSystem.getActive();
    const texKey = profile
      ? (profile.colorId === 'red'    ? 'player_red'    :
         profile.colorId === 'green'  ? 'player_green'  :
         profile.colorId === 'yellow' ? 'player_yellow' : 'player')
      : 'player';

    super(scene, x, y, texKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ---- HP / lives ---------------------------------------------------
    this.hp    = CONSTANTS.PLAYER_MAX_HP;
    this.maxHp = CONSTANTS.PLAYER_MAX_HP;

    // ---- State flags --------------------------------------------------
    this._invincible   = false;
    this._facingRight  = true;
    this._isOnGround   = false;

    // ---- Weapon / ammo state ------------------------------------------
    this._lastFireTime = 0;
    /** @type {Object.<number, number>} slotIndex -> current ammo count */
    this._ammo = {};
    this._initAmmo();

    // ---- Physics body -------------------------------------------------
    this.body.setSize(24, 42).setOffset(4, 6);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(600);

    this.setDepth(5);

    // ---- Respawn flash tween handle -----------------------------------
    this._flashTween = null;
  }

  // ------------------------------------------------------------------
  // Initialise ammo counts from the current inventory
  // ------------------------------------------------------------------
  _initAmmo() {
    for (let i = 0; i < 4; i++) {
      const weapon = InventorySystem.slots[i];
      if (weapon) {
        // Use existing currentAmmo if available, otherwise full magazine
        this._ammo[i] = (typeof weapon.currentAmmo === 'number')
          ? weapon.currentAmmo
          : (weapon.magazineSize || Infinity);
      } else {
        this._ammo[i] = 0;
      }
    }
  }

  // ------------------------------------------------------------------
  // Main update – called every frame by GameScene
  // ------------------------------------------------------------------
  update(time, delta, cursors, keys /*, platforms */) {
    if (!this.active) return;

    const onGround = this.body.blocked.down;

    // ----------------------------------------------------------------
    // Horizontal movement
    // ----------------------------------------------------------------
    const movingLeft  = cursors.left.isDown  || keys.a.isDown;
    const movingRight = cursors.right.isDown || keys.d.isDown;

    if (movingLeft) {
      this.setVelocityX(-CONSTANTS.PLAYER_SPEED);
      this._facingRight = false;
      this.setFlipX(true);
    } else if (movingRight) {
      this.setVelocityX(CONSTANTS.PLAYER_SPEED);
      this._facingRight = true;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // ----------------------------------------------------------------
    // Jump  (Space / Up / W)
    // ----------------------------------------------------------------
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(cursors.space) ||
      Phaser.Input.Keyboard.JustDown(cursors.up)    ||
      Phaser.Input.Keyboard.JustDown(keys.w);

    if (jumpJustPressed && onGround) {
      this.setVelocityY(CONSTANTS.PLAYER_JUMP_VELOCITY);
      AudioSystem.jump();
    }

    // ----------------------------------------------------------------
    // Shoot / melee  (mouse click | Ctrl | X)
    // ----------------------------------------------------------------
    const shootHeld =
      this.scene.input.activePointer.isDown ||
      (cursors.ctrl && cursors.ctrl.isDown) ||
      keys.x.isDown;

    const weapon = InventorySystem.getActive();

    if (weapon && shootHeld) {
      if (weapon.isMelee) {
        this._meleeAttack(time);
      } else {
        this._shoot(time, weapon);
      }
    }

    // NOTE: Slot switching (1-4) is handled in GameScene to avoid key-map conflicts.

    // ----------------------------------------------------------------
    // Manual reload  (R key passed from GameScene as keys.r)
    // ----------------------------------------------------------------
    if (keys.r && Phaser.Input.Keyboard.JustDown(keys.r)) {
      const slot = InventorySystem.activeSlot;
      const activeWeapon = InventorySystem.getActive();
      if (activeWeapon && !activeWeapon.isMelee && !InventorySystem.isReloading(slot)) {
        // Only reload if magazine is not already full
        const currentAmmo = this._ammo[slot];
        const maxAmmo     = activeWeapon.magazineSize;
        if (typeof maxAmmo === 'number' && currentAmmo < maxAmmo) {
          this._startReload(slot, activeWeapon);
        }
      }
    }

    this._isOnGround = onGround;
  }

  // ------------------------------------------------------------------
  // Melee attack – emits PLAYER_MELEE for GameScene to handle overlaps
  // ------------------------------------------------------------------
  _meleeAttack(time) {
    const weapon = InventorySystem.getActive();
    if (!weapon) return;
    if (time - this._lastFireTime < (weapon.fireRateMs || 500)) return;

    this._lastFireTime = time;

    const dirX = this._facingRight ? 1 : -1;
    const hitX = this.x + dirX * 30;
    const hitY = this.y;

    EventBus.emit('PLAYER_MELEE', { x: hitX, y: hitY, damage: weapon.damage || 1, range: 40 });

    // Brief white flash as swing visual
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => { if (this.active) this.clearTint(); });

    AudioSystem.shoot();
  }

  // ------------------------------------------------------------------
  // Ranged shot
  // ------------------------------------------------------------------
  _shoot(time, weapon) {
    const slotIndex = InventorySystem.activeSlot;

    // Bail if this slot is currently reloading
    if (InventorySystem.isReloading(slotIndex)) return;

    // Fire-rate gate
    if (time - this._lastFireTime < weapon.fireRateMs) return;

    // Initialise ammo for slot if not already tracked
    if (this._ammo[slotIndex] === undefined || this._ammo[slotIndex] === null) {
      this._ammo[slotIndex] = weapon.magazineSize;
    }

    // Empty magazine – start reload instead of shooting
    if (this._ammo[slotIndex] <= 0) {
      this._startReload(slotIndex, weapon);
      return;
    }

    this._lastFireTime = time;
    this._ammo[slotIndex]--;

    // Spawn point slightly ahead of the player and vertically centred
    const dirX = this._facingRight ? 1 : -1;
    const bx   = this.x + dirX * 20;
    const by   = this.y - 5;

    if (weapon.isDouble) {
      BulletPool.fire(bx, by - 5, dirX, weapon.speed, weapon);
      BulletPool.fire(bx, by + 5, dirX, weapon.speed, weapon);
    } else {
      BulletPool.fire(bx, by, dirX, weapon.speed, weapon);
    }

    AudioSystem.shoot();

    // Notify HUD about ammo change
    EventBus.emit('INVENTORY_CHANGED', InventorySystem.slots);

    // Auto-reload when magazine runs dry
    if (this._ammo[slotIndex] <= 0) {
      this._startReload(slotIndex, weapon);
    }
  }

  // ------------------------------------------------------------------
  // Start a timed reload for the given slot
  // ------------------------------------------------------------------
  _startReload(slotIndex, weapon) {
    if (!weapon || !weapon.reloadMs || weapon.reloadMs <= 0) return;
    if (InventorySystem.isReloading(slotIndex)) return;

    // InventorySystem.startReload emits RELOAD_START (HUDScene plays the sound)
    // and sets up its own timeout to call completeReload + emit RELOAD_COMPLETE.
    InventorySystem.startReload(slotIndex);

    // Only Player's local ammo counter needs a separate timer.
    const magazineSize = weapon.magazineSize;
    this.scene.time.delayedCall(weapon.reloadMs, () => {
      if (!this.active) return;
      this._ammo[slotIndex] = magazineSize;
    });
  }

  // ------------------------------------------------------------------
  // Damage / healing / death
  // ------------------------------------------------------------------

  /**
   * Apply damage to the player.
   * Has no effect while invincible (post-hit grace period).
   * @param {number} amount  Positive damage value.
   */
  takeDamage(amount) {
    if (this._invincible) return;

    this.hp = Math.max(0, this.hp - amount);

    AudioSystem.heartLost();
    EventBus.emit('PLAYER_HP_CHANGED', this.hp, this.maxHp);

    // Red flash
    this.setTint(0xff0000);
    this.scene.time.delayedCall(300, () => { if (this.active) this.clearTint(); });

    // Brief invincibility window to prevent instant multi-hits
    this._invincible = true;
    this.scene.time.delayedCall(800, () => { if (this.active) this._invincible = false; });

    if (this.hp <= 0) {
      EventBus.emit('PLAYER_DIED');
    }
  }

  /**
   * Restore HP up to the maximum.
   * @param {number} amount  Positive heal value.
   */
  heal(amount) {
    if (amount <= 0) return;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.hp > before) {
      EventBus.emit('PLAYER_HP_CHANGED', this.hp, this.maxHp);
      // Green flash
      this.setTint(0x00ff00);
      this.scene.time.delayedCall(300, () => { if (this.active) this.clearTint(); });
    }
  }

  // ------------------------------------------------------------------
  // Respawn – reposition, restore full HP, 2-second invincibility flash
  // ------------------------------------------------------------------

  /**
   * Teleport the player to (x, y), restore full HP, and grant
   * a 2-second invincibility + blinking animation.
   * @param {number} x
   * @param {number} y
   */
  respawn(x, y) {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.hp = CONSTANTS.PLAYER_MAX_HP;
    EventBus.emit('PLAYER_HP_CHANGED', this.hp, this.maxHp);

    // Reinitialise ammo in case slots changed during the death sequence
    this._initAmmo();

    // Invincibility + alpha-blink for ~1.6 s (200 ms × 2 yoyo × 4 repeats)
    this._invincible = true;
    if (this._flashTween) this._flashTween.stop();

    this._flashTween = this.scene.tweens.add({
      targets:  this,
      alpha:    { from: 0.3, to: 1 },
      yoyo:     true,
      duration: 200,
      repeat:   7,       // 8 cycles × 400 ms = 3.2 s total (generous)
      onComplete: () => {
        if (this.active) {
          this.setAlpha(1);
          this._invincible = false;
        }
      },
    });
  }

  // ------------------------------------------------------------------
  // Read-only accessors used by HUD / GameScene
  // ------------------------------------------------------------------

  /** Returns the current ammo count for a given weapon slot. */
  getAmmo(slotIndex) {
    return this._ammo[slotIndex] !== undefined ? this._ammo[slotIndex] : 0;
  }

  /** Returns true while the post-hit invincibility grace period is active. */
  get isInvincible() {
    return this._invincible;
  }

  /** Returns true if the player is standing on solid ground this frame. */
  get isOnGround() {
    return this._isOnGround;
  }

  /** Returns true if the player sprite is currently facing right. */
  get facingRight() {
    return this._facingRight;
  }
}
