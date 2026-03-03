// =============================================================
// scenes/GameOverScene.js - Mathe-Shooter
// Displayed when the player loses all lives.
// Shows final star tally, resets progress to level 1, then
// returns to MenuScene.  Auto-advances after 10 seconds.
// =============================================================

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    // ── dark red background ──────────────────────────────────────
    this.add.rectangle(480, 270, 960, 540, 0x0a0000);

    // Eerie red vignette
    this.add.rectangle(480, 270, 960, 540, 0xff0000, 0.06);

    // ── GAME OVER title ──────────────────────────────────────────
    const gameOverText = this.add.text(480, 148, STRINGS.GAME_OVER, {
      fontSize: '76px',
      fill: '#ff4444',
      stroke: '#000',
      strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets:  gameOverText,
      alpha:    1,
      scaleX:   { from: 1.3, to: 1 },
      scaleY:   { from: 1.3, to: 1 },
      duration: 500,
      ease:     'Back.easeOut',
    });

    // Pulsing title effect
    this.tweens.add({
      targets:  gameOverText,
      alpha:    0.7,
      duration: 800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    600,
    });

    // ── Explanation texts ─────────────────────────────────────────
    this.add.text(480, 248, 'Alle Leben aufgebraucht!', {
      fontSize: '26px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // Animate explanations in
    this.tweens.add({
      targets: this.children.getAt(this.children.length - 1),
      alpha: 1, duration: 400, delay: 400,
    });

    this.add.text(480, 295, 'Du startest wieder bei Level 1.', {
      fontSize: '20px',
      fill: '#aaaaaa',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.children.getAt(this.children.length - 1),
      alpha: 1, duration: 400, delay: 600,
    });

    // ── Final stats ───────────────────────────────────────────────
    const profile = ProfileSystem.getActive();
    if (profile) {
      const totalStars = ProfileSystem.getTotalStars(profile.id);

      this.add.text(480, 355, `${profile.name}s Sterne: ${totalStars} / 30`, {
        fontSize: '24px',
        fill: '#ffcc00',
        stroke: '#000',
        strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: this.children.getAt(this.children.length - 1),
        alpha: 1, duration: 400, delay: 800,
      });

      // Star icons row
      const maxStarsToShow = Math.min(totalStars, 10);
      for (let i = 0; i < maxStarsToShow; i++) {
        const starObj = this.add.image(236 + i * 50, 400, 'star_gold')
          .setScale(0.8).setAlpha(0);
        this.tweens.add({
          targets: starObj,
          alpha: 1,
          duration: 200,
          delay: 900 + i * 60,
        });
      }
    }

    // ── Encouragement ─────────────────────────────────────────────
    this.add.text(480, 430, 'Gib nicht auf – du schaffst das!', {
      fontSize: '17px',
      fill: '#888888',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.children.getAt(this.children.length - 1),
      alpha: 1, duration: 400, delay: 1200,
    });

    // ── Back to menu / retry button ───────────────────────────────
    const btn = this.add.text(480, 475, STRINGS.BACK_TO_LEVEL1, {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#882222',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: btn, alpha: 1, duration: 400, delay: 1400 });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#aa3333' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#882222' }));
    btn.on('pointerdown', () => this._restart());

    // ── Countdown text ────────────────────────────────────────────
    this._countdownText = this.add.text(480, 520, '', {
      fontSize: '12px',
      fill: '#555555',
    }).setOrigin(0.5);

    // ── Auto-return after 10s ─────────────────────────────────────
    this._autoTimer = this.time.delayedCall(10000, () => this._restart());
  }

  update() {
    if (this._autoTimer && this._countdownText) {
      const remaining = Math.ceil(this._autoTimer.getRemaining() / 1000);
      this._countdownText.setText(`Weiter in ${remaining}s...`);
    }
  }

  _restart() {
    const profile = ProfileSystem.getActive();
    if (profile) {
      ProfileSystem.setLives(profile.id, CONSTANTS.PLAYER_START_LIVES);
      ProfileSystem.setCurrentLevel(profile.id, 1);
    }
    LevelManager.setLevel(1);
    this.scene.start('MenuScene');
  }
}
