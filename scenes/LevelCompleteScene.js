// =============================================================
// scenes/LevelCompleteScene.js - Mathe-Shooter
// Displayed after defeating the boss.  Shows earned stars,
// extra-life notification, best-weapon carry-over info.
// Auto-advances after 8 seconds.
// =============================================================

class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  init(data) {
    this.stars      = typeof data.stars     === 'number' ? data.stars     : 0;
    this.extraLife  = data.extraLife  || false;
    this.levelId    = data.levelId    || 1;
  }

  create() {
    // ── background overlay ───────────────────────────────────────
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.82);

    // Scattered gold stars in background
    for (let i = 0; i < 18; i++) {
      const sx    = Phaser.Math.Between(30, 930);
      const sy    = Phaser.Math.Between(30, 510);
      const scale = Phaser.Math.FloatBetween(0.4, 1.2);
      this.add.image(sx, sy, 'star_gold').setScale(scale).setAlpha(0.25);
    }

    // ── title ────────────────────────────────────────────────────
    const title = this.add.text(480, 82, STRINGS.LEVEL_COMPLETE, {
      fontSize: '50px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 400 });

    // ── "X Sterne verdient!" ─────────────────────────────────────
    const starsLabel = STRINGS.STARS_EARNED.replace('{n}', this.stars);
    const starsText  = this.add.text(480, 155, starsLabel, {
      fontSize: '26px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: starsText, alpha: 1, duration: 400, delay: 200 });

    // ── Star icons (animated) ─────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const starX  = 420 + i * 60;
      const starY  = 215;
      const filled = i < this.stars;
      const tex    = filled ? 'star_gold' : 'star_empty';
      const star   = this.add.image(starX, starY, tex)
        .setScale(0).setDepth(5);

      this.tweens.add({
        targets:  star,
        scaleX:   2,
        scaleY:   2,
        duration: 300,
        delay:    400 + i * 160,
        ease:     'Back.easeOut',
      });
    }

    // ── Extra life notification ───────────────────────────────────
    if (this.extraLife) {
      const extraText = this.add.text(480, 278, STRINGS.EXTRA_LIFE, {
        fontSize: '30px',
        fill: '#ff88ff',
        stroke: '#000',
        strokeThickness: 4,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: extraText,
        alpha:   1,
        duration: 500,
        delay:   700,
        yoyo:    true,
        repeat:  3,
      });
    }

    // ── Best weapon carry-over info ───────────────────────────────
    const profile    = ProfileSystem.getActive();
    const bestWepId  = profile ? ProfileSystem.getBestWeapon(profile.id) : null;
    if (bestWepId && bestWepId !== 'club') {
      const weapName = (STRINGS.WEAPON_NAMES && STRINGS.WEAPON_NAMES[bestWepId]) || bestWepId;
      const keepText = STRINGS.BEST_WEAPON_KEPT.replace('{name}', weapName);
      this.add.text(480, 328, keepText, {
        fontSize: '18px',
        fill: '#88ff88',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: this.children.getAt(this.children.length - 1),
        alpha: 1, duration: 400, delay: 900,
      });
    }

    // ── Level stars summary (current level) ──────────────────────
    const levelName = LEVELS[this.levelId - 1] ? LEVELS[this.levelId - 1].name : `Level ${this.levelId}`;
    this.add.text(480, 370, `${levelName} abgeschlossen`, {
      fontSize: '16px',
      fill: '#aaaaff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // ── Navigation buttons ────────────────────────────────────────
    const isLastLevel = this.levelId === 10;
    const btnLabel    = isLastLevel ? 'Zum Menü' : 'Nächstes Level →';

    const nextBtn = this.add.text(480, 415, btnLabel, {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: '#ffff00' }));
    nextBtn.on('pointerout',  () => nextBtn.setStyle({ fill: '#ffffff' }));
    nextBtn.on('pointerdown', () => this._goNext(isLastLevel));

    // Back to menu (smaller)
    const menuBtn = this.add.text(480, 468, 'Zum Hauptmenü', {
      fontSize: '18px',
      fill: '#aaaaaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffffff' }));
    menuBtn.on('pointerout',  () => menuBtn.setStyle({ fill: '#aaaaaa' }));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // ── Auto-advance after 8s ─────────────────────────────────────
    this._going = false;
    this._autoTimer = this.time.delayedCall(8000, () => {
      this._goNext(isLastLevel);
    });

    // Countdown hint
    this._countdownText = this.add.text(480, 502, '', {
      fontSize: '12px',
      fill: '#666666',
    }).setOrigin(0.5);
  }

  update() {
    // Show remaining seconds until auto-advance
    if (this._autoTimer && this._countdownText) {
      const remaining = Math.ceil(this._autoTimer.getRemaining() / 1000);
      this._countdownText.setText(`Weiter in ${remaining}s...`);
    }
  }

  _goNext(isLastLevel) {
    console.log('[LevelComplete] _goNext called, isLastLevel=', isLastLevel, '_going=', this._going);
    if (this._going) return;
    this._going = true;

    // Cancel the auto-advance timer so it doesn't fire after manual click
    if (this._autoTimer) {
      this._autoTimer.remove(false);
      this._autoTimer = null;
    }

    if (isLastLevel) {
      console.log('[LevelComplete] → MenuScene');
      this.scene.start('MenuScene');
    } else {
      LevelManager.nextLevel();
      const nextId = LevelManager.currentLevelId;
      console.log('[LevelComplete] → GameScene levelId=', nextId);
      this.scene.start('GameScene', { levelId: nextId });
    }
  }
}
