// =============================================================
// scenes/HUDScene.js - Mathe-Shooter
// Parallel HUD scene.
// Shows: HP hearts, lives counter, weapon slots (1-4), shield
// slot, reload progress bar, score.
// =============================================================

class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    // ── HP hearts ────────────────────────────────────────────────
    // 3 hearts, each represents 100 HP (total 300 HP)
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(30 + i * 38, 30, 'heart_full')
        .setScrollFactor(0)
        .setDepth(10);
      this.hearts.push(h);
    }

    // ── Lives counter ────────────────────────────────────────────
    this.livesText = this.add.text(142, 18, '', {
      fontSize: '14px',
      fill: '#ffaaaa',
      stroke: '#000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(10);

    // ── Score / points (top-right) ────────────────────────────────
    this._score    = 0;
    this.scoreText = this.add.text(870, 18, 'Punkte: 0', {
      fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(10);

    // ── Weapon slot backgrounds ───────────────────────────────────
    this.slotBgs   = [];
    this.slotIcons = [];
    this.slotTexts = [];

    for (let i = 0; i < 4; i++) {
      const sx = 360 + i * 65;
      const sy = 510;

      // Slot border/background
      const bg = this.add.rectangle(sx, sy, 55, 55, 0x000000, 0.7)
        .setScrollFactor(0).setDepth(10);
      bg.setStrokeStyle(1, 0x445566);
      this.slotBgs.push(bg);

      // Weapon icon (hidden until weapon assigned)
      const icon = this.add.image(sx, sy - 5, 'weapon_item_t1')
        .setScrollFactor(0).setDepth(11).setVisible(false).setScale(0.9);
      this.slotIcons.push(icon);

      // Slot number + name label
      const label = this.add.text(sx - 25, sy + 20, `${i + 1}`, {
        fontSize: '10px',
        fill: '#aaaaaa',
      }).setScrollFactor(0).setDepth(12);
      this.slotTexts.push(label);
    }

    // Active-slot highlight border
    this.activeSlotHighlight = this.add.rectangle(360, 510, 57, 57, 0x000000, 0)
      .setScrollFactor(0).setDepth(13);
    this.activeSlotHighlight.setStrokeStyle(2, 0xffffff);

    // ── Shield slot ───────────────────────────────────────────────
    this.shieldBg = this.add.rectangle(635, 510, 45, 45, 0x333300, 0.7)
      .setScrollFactor(0).setDepth(10);
    this.shieldBg.setStrokeStyle(1, 0x887722);

    this.shieldIcon = this.add.image(635, 508, 'shield_item')
      .setScrollFactor(0).setDepth(11).setVisible(false);

    this.add.text(613, 527, STRINGS.SHIELD_SLOT, {
      fontSize: '9px',
      fill: '#aaaaaa',
    }).setScrollFactor(0).setDepth(11);

    // ── Reload bar ────────────────────────────────────────────────
    this.reloadBg = this.add.rectangle(480, 488, 202, 12, 0x333333)
      .setScrollFactor(0).setDepth(10).setVisible(false);

    // Reload fill: starts at x=380, grows right
    this.reloadBar = this.add.rectangle(380, 488, 0, 10, 0x88aaff)
      .setScrollFactor(0).setDepth(11).setOrigin(0, 0.5).setVisible(false);

    this.reloadText = this.add.text(480, 474, STRINGS.RELOADING, {
      fontSize: '11px',
      fill: '#88aaff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11).setVisible(false);

    this._reloadDuration = 0;
    this._reloadStart    = 0;

    // ── EventBus subscriptions ────────────────────────────────────
    EventBus.on('PLAYER_HP_CHANGED', this._updateHP,        this);
    EventBus.on('INVENTORY_CHANGED', this._updateInventory, this);
    EventBus.on('RELOAD_START',      this._onReloadStart,   this);
    EventBus.on('RELOAD_COMPLETE',   this._onReloadComplete, this);
    EventBus.on('ENEMY_KILLED',      this._onEnemyKilled,   this);

    // ── Initial state ─────────────────────────────────────────────
    this._updateInventory(InventorySystem.slots);
    this._updateHP(CONSTANTS.PLAYER_MAX_HP, CONSTANTS.PLAYER_MAX_HP);
    this._updateLives();
  }

  // ─────────────────────────────────────────────────────────────
  // _updateHP
  // HP 300 → 3 full hearts
  // HP 200 → 2 full, 1 empty
  // HP 150 → 1 full, 1 half, 1 empty
  // ─────────────────────────────────────────────────────────────
  _updateHP(hp, maxHp) {
    // Each heart covers 100 HP.  Heart i covers range [i*100, (i+1)*100].
    // Displayed in reverse: heart[0] = 200-300, heart[1] = 100-200, heart[2] = 0-100
    for (let i = 0; i < 3; i++) {
      const heartMin = (2 - i) * 100;      // e.g. i=0 → 200, i=1 → 100, i=2 → 0
      const heartHp  = Math.max(0, Math.min(100, hp - heartMin));

      if (heartHp >= 100) {
        this.hearts[i].setTexture('heart_full');
      } else if (heartHp > 0) {
        this.hearts[i].setTexture('heart_half');
      } else {
        this.hearts[i].setTexture('heart_empty');
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _updateLives
  // ─────────────────────────────────────────────────────────────
  _updateLives() {
    const profile = ProfileSystem.getActive();
    const lives   = profile ? ProfileSystem.getLives(profile.id) : CONSTANTS.PLAYER_START_LIVES;
    this.livesText.setText(`♥ ×${lives}`);
  }

  // ─────────────────────────────────────────────────────────────
  // _updateInventory
  // ─────────────────────────────────────────────────────────────
  _updateInventory(slots) {
    for (let i = 0; i < 4; i++) {
      const weapon = slots[i];
      if (weapon) {
        const tier   = weapon.tier || 1;
        const texKey = `weapon_item_t${Math.min(tier, 3)}`;

        if (this.scene.systems.textures.exists(texKey)) {
          this.slotIcons[i].setTexture(texKey);
        }
        this.slotIcons[i].setVisible(true);

        const name = (STRINGS.WEAPON_NAMES && STRINGS.WEAPON_NAMES[weapon.id]) || weapon.id || '';
        this.slotTexts[i].setText(`${i + 1} ${name.substring(0, 8)}`);
      } else {
        this.slotIcons[i].setVisible(false);
        this.slotTexts[i].setText(`${i + 1} ${STRINGS.SLOT_EMPTY || 'Leer'}`);
      }

      // Highlight active slot
      this.slotBgs[i].setFillStyle(
        i === InventorySystem.activeSlot ? 0x334466 : 0x000000, 0.7
      );
    }

    // Move active-slot highlight rectangle
    const activeX = 360 + InventorySystem.activeSlot * 65;
    this.activeSlotHighlight.setX(activeX);

    // Shield slot visibility
    const shieldHeld = InventorySystem.shieldSlot !== null;
    this.shieldIcon.setVisible(shieldHeld);
    this.shieldBg.setFillStyle(shieldHeld ? 0x665500 : 0x333300, 0.7);
  }

  // ─────────────────────────────────────────────────────────────
  // _onReloadStart
  // ─────────────────────────────────────────────────────────────
  _onReloadStart(data) {
    this._reloadDuration = data.duration;
    this._reloadStart    = Date.now();
    this.reloadBg.setVisible(true);
    this.reloadBar.setVisible(true).setDisplaySize(0, 10);
    this.reloadText.setVisible(true);
    AudioSystem.reload();
  }

  // ─────────────────────────────────────────────────────────────
  // _onReloadComplete
  // ─────────────────────────────────────────────────────────────
  _onReloadComplete() {
    this.reloadBg.setVisible(false);
    this.reloadBar.setVisible(false);
    this.reloadText.setVisible(false);
    this._reloadDuration = 0;
  }

  // ─────────────────────────────────────────────────────────────
  // _onEnemyKilled
  // ─────────────────────────────────────────────────────────────
  _onEnemyKilled(data) {
    this._score += (data && data.points) ? data.points : 10;
    this.scoreText.setText(`Punkte: ${this._score}`);
  }

  // ─────────────────────────────────────────────────────────────
  // update – animate reload bar
  // ─────────────────────────────────────────────────────────────
  update() {
    if (this.reloadBg.visible && this._reloadDuration > 0) {
      const elapsed = Date.now() - this._reloadStart;
      const ratio   = Math.min(1, elapsed / this._reloadDuration);
      this.reloadBar.setDisplaySize(ratio * 200, 10);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // shutdown
  // ─────────────────────────────────────────────────────────────
  shutdown() {
    EventBus.off('PLAYER_HP_CHANGED', this._updateHP,         this);
    EventBus.off('INVENTORY_CHANGED', this._updateInventory,  this);
    EventBus.off('RELOAD_START',      this._onReloadStart,    this);
    EventBus.off('RELOAD_COMPLETE',   this._onReloadComplete, this);
    EventBus.off('ENEMY_KILLED',      this._onEnemyKilled,    this);
  }
}
