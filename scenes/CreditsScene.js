// =============================================================
// scenes/CreditsScene.js - Mathe-Shooter
// Victory / credits screen shown after clearing level 10.
// Features: falling gold stars, title, story text, player sprite.
// Auto-returns to MenuScene after 15 seconds.
// =============================================================

class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create() {
    // ── deep-space background ────────────────────────────────────
    this.add.rectangle(480, 270, 960, 540, 0x0a0a1a);

    // Static background sparkles
    for (let i = 0; i < 60; i++) {
      const sx    = Phaser.Math.Between(10, 950);
      const sy    = Phaser.Math.Between(10, 530);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
      this.add.circle(sx, sy, 1, 0xffffff, alpha);
    }

    // ── Falling gold stars ───────────────────────────────────────
    for (let i = 0; i < 22; i++) {
      const sx    = Phaser.Math.Between(50, 910);
      const sy    = Phaser.Math.Between(-120, 200);
      const scale = Phaser.Math.FloatBetween(0.5, 1.8);
      const delay = i * 90;

      const star = this.add.image(sx, sy, 'star_gold')
        .setScale(scale)
        .setAlpha(0);

      // Fade in
      this.tweens.add({
        targets:  star,
        alpha:    Phaser.Math.FloatBetween(0.6, 1.0),
        duration: 400,
        delay,
        onComplete: () => {
          // Then fall down continuously
          this.tweens.add({
            targets:  star,
            y:        star.y + Phaser.Math.Between(500, 750),
            alpha:    0,
            duration: Phaser.Math.Between(1800, 3200),
            ease:     'Quad.easeIn',
            repeat:   -1,
            repeatDelay: Phaser.Math.Between(0, 800),
            onRepeat: () => {
              star.setAlpha(1);
              star.y = Phaser.Math.Between(-100, -20);
              star.x = Phaser.Math.Between(50, 910);
            },
          });
        },
      });
    }

    // ── Main title ───────────────────────────────────────────────
    const title = this.add.text(480, 110, STRINGS.CREDITS_TITLE, {
      fontSize: '68px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets:  title,
      alpha:    1,
      scaleX:   { from: 0.5, to: 1 },
      scaleY:   { from: 0.5, to: 1 },
      duration: 700,
      ease:     'Back.easeOut',
    });

    // Gentle title pulse
    this.tweens.add({
      targets:  title,
      scaleX:   1.04,
      scaleY:   1.04,
      duration: 1400,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    800,
    });

    // ── Story text ───────────────────────────────────────────────
    const storyText = this.add.text(480, 228, STRINGS.CREDITS_TEXT, {
      fontSize: '22px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: storyText, alpha: 1, duration: 600, delay: 600 });

    // ── Sub-text / tagline ───────────────────────────────────────
    const subText = this.add.text(480, 345, STRINGS.CREDITS_SUBTEXT, {
      fontSize: '30px',
      fill: '#ff88ff',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: subText, alpha: 1, duration: 600, delay: 1200 });

    // Bounce sub-text
    this.tweens.add({
      targets:  subText,
      y:        350,
      duration: 900,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    1800,
    });

    // ── Player sprite (big) ──────────────────────────────────────
    const profile        = ProfileSystem.getActive();
    const colorData      = profile
      ? (ProfileSystem.AVATAR_COLORS.find(c => c.id === profile.colorId) || ProfileSystem.AVATAR_COLORS[0])
      : ProfileSystem.AVATAR_COLORS[0];
    const playerTexture  = colorData.texture || 'player';

    const playerSprite = this.add.image(480, 425, playerTexture)
      .setScale(0)
      .setAlpha(0);

    this.tweens.add({
      targets:  playerSprite,
      scaleX:   3,
      scaleY:   3,
      alpha:    1,
      duration: 500,
      delay:    1500,
      ease:     'Back.easeOut',
    });

    // Player bouncing
    this.tweens.add({
      targets:  playerSprite,
      y:        420,
      duration: 600,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    2100,
    });

    // ── Total stars earned ────────────────────────────────────────
    if (profile) {
      const totalStars = ProfileSystem.getTotalStars(profile.id);
      this.add.text(480, 472, `${totalStars} / 30 Sterne gesammelt!`, {
        fontSize: '18px',
        fill: '#ffcc00',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: this.children.getAt(this.children.length - 1),
        alpha: 1, duration: 400, delay: 2000,
      });
    }

    // ── Back to menu button ───────────────────────────────────────
    const btn = this.add.text(480, 508, 'Zurück zum Menü', {
      fontSize: '22px',
      fill: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

    this.tweens.add({ targets: btn, alpha: 1, duration: 400, delay: 2500 });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#3355cc', fill: '#ffff00' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#2244aa', fill: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.start('MenuScene'));

    // ── Auto-return ───────────────────────────────────────────────
    this.time.delayedCall(15000, () => this.scene.start('MenuScene'));
  }
}
