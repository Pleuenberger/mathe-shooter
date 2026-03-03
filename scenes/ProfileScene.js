// =============================================================
// scenes/ProfileScene.js - Mathe-Shooter
// Profile selection screen. Shows up to 4 profile cards in a 2x2
// grid plus a "New Profile" button when fewer than 4 profiles exist.
//
// Long-press (2 s) a card → delete confirmation.
// "New Profile" → inline form (name input + colour picker).
// =============================================================

class ProfileScene extends Phaser.Scene {
  constructor() {
    super('ProfileScene');
  }

  create() {
    // ── background ──────────────────────────────────────────────
    this.add.rectangle(480, 270, 960, 540, 0x1a1a2e);

    // Decorative stars in background
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(20, 940);
      const sy = Phaser.Math.Between(20, 520);
      const sz = Phaser.Math.FloatBetween(0.3, 1.0);
      this.add.image(sx, sy, 'star_gold').setScale(sz).setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
    }

    // ── title ───────────────────────────────────────────────────
    this.add.text(480, 55, STRINGS.PROFILE_SELECT, {
      fontSize: '36px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // ── state ───────────────────────────────────────────────────
    this._formVisible    = false;
    this._deleteTarget   = null;
    this._holdTimer      = null;
    this._confirmGroup   = null;
    this._formGroup      = null;
    this._newProfileName = '';
    this._newColorIndex  = 0;

    // ── render cards ────────────────────────────────────────────
    this._cardContainer = this.add.container(0, 0);
    this._renderCards();
  }

  // ─────────────────────────────────────────────────────────────
  // _renderCards – draw all profile cards + new-profile button
  // ─────────────────────────────────────────────────────────────
  _renderCards() {
    // Destroy previous card container contents
    this._cardContainer.removeAll(true);

    const profiles = ProfileSystem.getProfiles();

    // 2×2 grid layout
    const cols      = 2;
    const cardW     = 340;
    const cardH     = 160;
    const startX    = 150;
    const startY    = 130;
    const gapX      = 40;
    const gapY      = 30;

    profiles.forEach((profile, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx  = startX + col * (cardW + gapX);
      const cy  = startY + row * (cardH + gapY);
      this._buildProfileCard(profile, cx, cy, cardW, cardH);
    });

    // "New Profile" button – only when fewer than 4 profiles
    if (profiles.length < ProfileSystem.MAX_PROFILES) {
      const idx   = profiles.length;
      const col   = idx % cols;
      const row   = Math.floor(idx / cols);
      const cx    = startX + col * (cardW + gapX);
      const cy    = startY + row * (cardH + gapY);
      this._buildNewProfileButton(cx, cy, cardW, cardH);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _buildProfileCard
  // ─────────────────────────────────────────────────────────────
  _buildProfileCard(profile, cx, cy, cardW, cardH) {
    // Look up colour data
    const colorData = ProfileSystem.AVATAR_COLORS.find(c => c.id === profile.colorId)
      || ProfileSystem.AVATAR_COLORS[0];

    // Card background
    const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x222244, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, colorData.value);

    // Player avatar sprite (top-left of card)
    const avatarTexture = colorData.texture || 'player';
    const avatar = this.add.image(cx + 36, cy + cardH / 2, avatarTexture)
      .setScale(1.4);

    // Profile name
    const nameText = this.add.text(cx + 80, cy + 24, profile.name, {
      fontSize: '22px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    });

    // Level progress
    const progress = ProfileSystem.getLevelProgress(profile.id);
    const currentLv = ProfileSystem.getCurrentLevel(profile.id);
    const lvText = this.add.text(cx + 80, cy + 58, `Level ${currentLv} / 10`, {
      fontSize: '16px',
      fill: '#aaddff',
    });

    // Total stars
    const totalStars = ProfileSystem.getTotalStars(profile.id);
    const starsText  = this.add.text(cx + 80, cy + 84, `⭐ ${totalStars} / 30`, {
      fontSize: '16px',
      fill: '#ffcc00',
    });

    // Lives
    const lives = ProfileSystem.getLives(profile.id);
    const livesText = this.add.text(cx + 80, cy + 110, `♥ ${lives} Leben`, {
      fontSize: '14px',
      fill: '#ff8888',
    });

    // Colour dot indicator (bottom-right)
    const colorDot = this.add.circle(cx + cardW - 18, cy + cardH - 18, 8, colorData.value);

    // Invisible hit zone for the whole card
    const hitZone = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Visible delete button (✕) at top-right of card
    let _deletePressed = false;
    const delBg = this.add.rectangle(cx + cardW - 16, cy + 16, 28, 28, 0x882222, 1)
      .setInteractive({ useHandCursor: true });
    const delTxt = this.add.text(cx + cardW - 16, cy + 16, '✕', {
      fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    delBg.on('pointerover', () => delBg.setFillStyle(0xcc3333));
    delBg.on('pointerout',  () => delBg.setFillStyle(0x882222));
    delBg.on('pointerdown', () => {
      _deletePressed = true;
      this._showDeleteConfirm(profile);
    });

    // ── interaction ──────────────────────────────────────────
    hitZone.on('pointerover', () => bg.setFillStyle(0x333366));
    hitZone.on('pointerout',  () => {
      bg.setFillStyle(0x222244);
      this._clearHoldTimer();
    });

    // Click → select profile (unless delete button was pressed)
    hitZone.on('pointerup', () => {
      this._clearHoldTimer();
      if (_deletePressed) { _deletePressed = false; return; }
      ProfileSystem.setActive(profile.id);
      this.scene.start('MenuScene');
    });

    // Long press (pointer down held 2 s) → delete confirmation
    hitZone.on('pointerdown', () => {
      this._holdTimer = this.time.delayedCall(2000, () => {
        this._showDeleteConfirm(profile);
      });
    });

    this._cardContainer.add([bg, avatar, nameText, lvText, starsText, livesText, colorDot, hitZone, delBg, delTxt]);
  }

  // ─────────────────────────────────────────────────────────────
  // _buildNewProfileButton
  // ─────────────────────────────────────────────────────────────
  _buildNewProfileButton(cx, cy, cardW, cardH) {
    const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x1a2a1a, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x44aa44);

    const plusText = this.add.text(cx + cardW / 2, cy + cardH / 2 - 14, '+', {
      fontSize: '48px',
      fill: '#44aa44',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const labelText = this.add.text(cx + cardW / 2, cy + cardH / 2 + 28, STRINGS.PROFILE_NEW, {
      fontSize: '18px',
      fill: '#88cc88',
    }).setOrigin(0.5);

    const hitZone = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => { bg.setFillStyle(0x223322); plusText.setStyle({ fill: '#88ff88' }); });
    hitZone.on('pointerout',  () => { bg.setFillStyle(0x1a2a1a); plusText.setStyle({ fill: '#44aa44' }); });
    hitZone.on('pointerup',   () => this._showNewProfileForm());

    this._cardContainer.add([bg, plusText, labelText, hitZone]);
  }

  // ─────────────────────────────────────────────────────────────
  // _showNewProfileForm – inline form overlay
  // ─────────────────────────────────────────────────────────────
  _showNewProfileForm() {
    if (this._formVisible) return;
    this._formVisible    = true;
    this._newProfileName = '';
    this._newColorIndex  = 0;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.75).setDepth(50);

    // Panel
    const panel = this.add.rectangle(480, 270, 460, 340, 0x1a1a3a).setDepth(51);
    panel.setStrokeStyle(2, 0x4488ff);

    // Title
    const title = this.add.text(480, 130, STRINGS.PROFILE_NAME_PROMPT, {
      fontSize: '22px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(52);

    // Name display field
    const nameBg = this.add.rectangle(480, 195, 340, 44, 0x0a0a2a).setDepth(51);
    nameBg.setStrokeStyle(1, 0x4488ff);

    const nameDisplay = this.add.text(480, 195, '|', {
      fontSize: '22px',
      fill: '#ffcc00',
    }).setOrigin(0.5).setDepth(52);

    // Colour label
    this.add.text(480, 235, STRINGS.PROFILE_COLOR, {
      fontSize: '16px',
      fill: '#aaaaaa',
    }).setOrigin(0.5).setDepth(52);

    // Colour picker buttons
    const colorBtns = [];
    ProfileSystem.AVATAR_COLORS.forEach((col, idx) => {
      const bx = 300 + idx * 55;
      const btn = this.add.circle(bx, 265, 18, col.value).setDepth(52).setInteractive({ useHandCursor: true });

      // Label under each dot
      this.add.text(bx, 290, col.label, {
        fontSize: '10px',
        fill: '#ffffff',
      }).setOrigin(0.5).setDepth(52);

      btn.on('pointerdown', () => {
        this._newColorIndex = idx;
        colorBtns.forEach((b, i) => {
          b.setStrokeStyle(i === idx ? 3 : 0, 0xffffff);
        });
      });
      colorBtns.push(btn);
    });
    // Highlight first colour by default
    colorBtns[0].setStrokeStyle(3, 0xffffff);

    // Keyboard input
    const keyHandler = (event) => {
      const key = event.key;
      if (key === 'Backspace') {
        this._newProfileName = this._newProfileName.slice(0, -1);
      } else if (key === 'Enter') {
        confirmAction();
        return;
      } else if (key.length === 1 && this._newProfileName.length < 12) {
        this._newProfileName += key;
      }
      nameDisplay.setText(this._newProfileName + '|');
    };
    this.input.keyboard.on('keydown', keyHandler);

    // Confirm button
    const confirmBtn = this.add.text(400, 330, 'OK ✓', {
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#225522',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    // Cancel button
    const cancelBtn = this.add.text(560, 330, 'Abbrechen', {
      fontSize: '18px',
      fill: '#aaaaaa',
      backgroundColor: '#222222',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    const confirmAction = () => {
      const name = this._newProfileName.trim();
      if (name.length === 0) {
        nameDisplay.setStyle({ fill: '#ff4444' });
        nameDisplay.setText('Name eingeben!');
        this.time.delayedCall(1200, () => {
          nameDisplay.setStyle({ fill: '#ffcc00' });
          nameDisplay.setText(this._newProfileName + '|');
        });
        return;
      }
      const colorId = ProfileSystem.AVATAR_COLORS[this._newColorIndex].id;
      ProfileSystem.createProfile(name, colorId);
      cleanup();
      this._renderCards();
    };

    const cleanup = () => {
      this._formVisible = false;
      this.input.keyboard.off('keydown', keyHandler);
      overlay.destroy();
      panel.destroy();
      title.destroy();
      nameBg.destroy();
      nameDisplay.destroy();
      confirmBtn.destroy();
      cancelBtn.destroy();
      colorBtns.forEach(b => b.destroy());
      // Also destroy colour labels (they were added directly to scene, not tracked)
    };

    confirmBtn.on('pointerover', () => confirmBtn.setStyle({ backgroundColor: '#337733' }));
    confirmBtn.on('pointerout',  () => confirmBtn.setStyle({ backgroundColor: '#225522' }));
    confirmBtn.on('pointerdown', () => confirmAction());

    cancelBtn.on('pointerdown', () => cleanup());

    this._formGroup = { overlay, panel };

    // Blink cursor
    this.time.addEvent({
      delay: 500,
      repeat: -1,
      callback: () => {
        if (!this._formVisible) return;
        const cur = nameDisplay.text;
        if (cur.endsWith('|')) {
          nameDisplay.setText(cur.slice(0, -1));
        } else {
          nameDisplay.setText(cur + '|');
        }
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // _showDeleteConfirm – modal overlay for delete confirmation
  // ─────────────────────────────────────────────────────────────
  _showDeleteConfirm(profile) {
    if (this._confirmGroup) return; // already open

    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.75).setDepth(60);
    const panel   = this.add.rectangle(480, 270, 400, 220, 0x2a1a1a).setDepth(61);
    panel.setStrokeStyle(2, 0xff4444);

    const msg = this.add.text(480, 195, `"${profile.name}" löschen?`, {
      fontSize: '20px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(62);

    const warning = this.add.text(480, 235, 'Alle Fortschritte gehen verloren!', {
      fontSize: '14px',
      fill: '#ff8888',
    }).setOrigin(0.5).setDepth(62);

    const yesBtn = this.add.text(390, 300, 'Ja, löschen', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#882222',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });

    const noBtn = this.add.text(570, 300, 'Abbrechen', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#334455',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });

    const cleanup = () => {
      overlay.destroy(); panel.destroy(); msg.destroy();
      warning.destroy(); yesBtn.destroy(); noBtn.destroy();
      this._confirmGroup = null;
    };

    yesBtn.on('pointerdown', () => {
      ProfileSystem.deleteProfile(profile.id);
      cleanup();
      this._renderCards();
    });
    noBtn.on('pointerdown', () => cleanup());

    this._confirmGroup = { overlay, panel };
  }

  // ─────────────────────────────────────────────────────────────
  // _clearHoldTimer
  // ─────────────────────────────────────────────────────────────
  _clearHoldTimer() {
    if (this._holdTimer) {
      this._holdTimer.remove(false);
      this._holdTimer = null;
    }
  }
}
