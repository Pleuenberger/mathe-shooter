// =============================================================
// scenes/MenuScene.js - Mathe-Shooter
// Mario-style level map.  Level nodes (1-10) are arranged in a
// wave path across the screen.  Locked levels show a lock icon.
// Total stars shown top-right.  Clicking unlocked level starts
// GameScene.
// =============================================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // ── active profile ──────────────────────────────────────────
    this._profile = ProfileSystem.getActive();

    // ── background ──────────────────────────────────────────────
    this.add.image(480, 270, 'bg_sky').setScrollFactor(0);

    // Decorative ground strip at bottom
    this.add.rectangle(480, 525, 960, 30, 0x44aa22);
    this.add.rectangle(480, 512, 960, 6, 0x66cc44);

    // ── title ───────────────────────────────────────────────────
    const titleText = this.add.text(480, 42, STRINGS.GAME_TITLE, {
      fontSize: '46px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtle bounce on title
    this.tweens.add({
      targets: titleText,
      y: 46,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── profile indicator (top-left) ────────────────────────────
    if (this._profile) {
      const colorData = ProfileSystem.AVATAR_COLORS.find(c => c.id === this._profile.colorId)
        || ProfileSystem.AVATAR_COLORS[0];

      this.add.circle(22, 22, 10, colorData.value);
      this.add.text(36, 13, this._profile.name, {
        fontSize: '16px',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 2,
      });
    }

    // ── total stars counter (top-right) ─────────────────────────
    const totalStars = this._profile ? ProfileSystem.getTotalStars(this._profile.id) : 0;
    this.add.image(896, 22, 'star_gold').setScale(1.2);
    this.add.text(912, 13, `${totalStars} / 30`, {
      fontSize: '16px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 2,
    });

    // ── level node positions ─────────────────────────────────────
    // Wave path from left to right
    this._nodePositions = [
      { x: 100, y: 400 },  // L1
      { x: 200, y: 350 },  // L2
      { x: 320, y: 300 },  // L3
      { x: 440, y: 350 },  // L4
      { x: 560, y: 280 },  // L5
      { x: 650, y: 330 },  // L6
      { x: 750, y: 270 },  // L7
      { x: 820, y: 320 },  // L8
      { x: 880, y: 260 },  // L9
      { x: 935, y: 310 },  // L10
    ];

    // ── draw connecting path ─────────────────────────────────────
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(4, 0xddbb77, 0.8);
    pathGraphics.beginPath();
    pathGraphics.moveTo(this._nodePositions[0].x, this._nodePositions[0].y);
    for (let i = 1; i < this._nodePositions.length; i++) {
      pathGraphics.lineTo(this._nodePositions[i].x, this._nodePositions[i].y);
    }
    pathGraphics.strokePath();

    // Dotted effect on locked portions
    const pathDots = this.add.graphics();
    pathDots.fillStyle(0xddbb77, 0.4);

    // ── draw level nodes ─────────────────────────────────────────
    this._nodePositions.forEach((pos, idx) => {
      const levelId  = idx + 1;
      const levelCfg = LEVELS[idx]; // from data/levels.js
      const unlocked = this._profile
        ? LevelManager.isUnlocked(levelId, this._profile.id)
        : levelId === 1;

      const levelStars = this._profile
        ? (ProfileSystem.getLevelProgress(this._profile.id).stars[String(levelId)] || 0)
        : 0;

      this._buildLevelNode(pos.x, pos.y, levelId, levelCfg, unlocked, levelStars);
    });

    // ── STATISTIK button ─────────────────────────────────────────
    const statsBtn = this.add.text(480, 498, STRINGS.BTN_STATS, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 16, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    statsBtn.on('pointerover', () => statsBtn.setStyle({ backgroundColor: '#3355cc' }));
    statsBtn.on('pointerout',  () => statsBtn.setStyle({ backgroundColor: '#2244aa' }));
    statsBtn.on('pointerdown', () => {
      window.open('dashboard.html', '_blank');
    });

    // ── "Change Profile" button ───────────────────────────────────
    const profileBtn = this.add.text(80, 498, '← Profil', {
      fontSize: '16px',
      fill: '#aaaaaa',
      backgroundColor: '#222233',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    profileBtn.on('pointerover', () => profileBtn.setStyle({ fill: '#ffffff' }));
    profileBtn.on('pointerout',  () => profileBtn.setStyle({ fill: '#aaaaaa' }));
    profileBtn.on('pointerdown', () => this.scene.start('ProfileScene'));
  }

  // ─────────────────────────────────────────────────────────────
  // _buildLevelNode
  // ─────────────────────────────────────────────────────────────
  _buildLevelNode(x, y, levelId, levelCfg, unlocked, starCount) {
    const radius    = 28;
    const nodeColor = unlocked ? 0x2266cc : 0x555566;
    const rimColor  = unlocked ? 0x88bbff : 0x888899;

    // Node circle background
    const circle = this.add.circle(x, y, radius, nodeColor);
    circle.setStrokeStyle(3, rimColor);

    // Level number
    const numText = this.add.text(x, y, String(levelId), {
      fontSize: '20px',
      fill: unlocked ? '#ffffff' : '#888888',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Lock icon for locked levels
    if (!unlocked) {
      this.add.image(x + 14, y - 14, 'lock_icon').setScale(0.85);
    }

    // Star indicators below node
    for (let s = 0; s < 3; s++) {
      const starX  = x - 18 + s * 18;
      const starY  = y + radius + 12;
      const filled = s < starCount;
      this.add.image(starX, starY, filled ? 'star_gold' : 'star_empty').setScale(0.55);
    }

    // Level name label (show only for first 3 levels or unlocked)
    if (unlocked && levelCfg && levelCfg.name) {
      this.add.text(x, y - radius - 12, levelCfg.name, {
        fontSize: '11px',
        fill: '#eecc88',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // Hit zone
    const hitZone = this.add.circle(x, y, radius + 6, 0x000000, 0)
      .setInteractive({ useHandCursor: unlocked });

    if (unlocked) {
      hitZone.on('pointerover', () => { circle.setFillStyle(0x3377ee); });
      hitZone.on('pointerout',  () => { circle.setFillStyle(nodeColor); });
      hitZone.on('pointerdown', () => {
        if (this._profile) ProfileSystem.setActive(this._profile.id);
        LevelManager.setLevel(levelId);
        this.scene.start('GameScene', { levelId });
      });
    } else {
      // Locked – show how many more stars needed on click
      hitZone.on('pointerdown', () => {
        if (!this._profile) return;
        const needed = LevelManager.starsNeeded(levelId, this._profile.id);
        this._showLockedMessage(x, y, needed);
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _showLockedMessage – floating "X Sterne nötig" tooltip
  // ─────────────────────────────────────────────────────────────
  _showLockedMessage(x, y, starsNeeded) {
    const msg = STRINGS.STARS_NEEDED.replace('{n}', starsNeeded);
    const txt = this.add.text(x, y - 50, msg, {
      fontSize: '14px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: '#000000bb',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: txt,
      y: y - 80,
      alpha: 0,
      duration: 1600,
      onComplete: () => txt.destroy(),
    });
  }
}
