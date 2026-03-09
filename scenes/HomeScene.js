// =============================================================
// scenes/HomeScene.js - Mathe-Shooter
// Entry screen shown before ProfileScene.
// Flow: BootScene -> HomeScene -> ProfileScene -> MenuScene
// =============================================================

class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    const W = 960, H = 540;

    // Background
    this.add.tileSprite(W / 2, H / 2, W, H, 'bg_meadow').setDepth(-10);

    // Animated clouds
    this._clouds = [];
    for (let i = 0; i < 5; i++) {
      const cx = Phaser.Math.Between(0, W);
      const cy = Phaser.Math.Between(30, 140);
      const cloud = this.add.image(cx, cy, 'cloud')
        .setAlpha(0.85)
        .setScale(Phaser.Math.FloatBetween(0.8, 1.4))
        .setDepth(-5);
      this._clouds.push(cloud);
    }

    // Title
    this._titleText = this.add.text(W / 2, 90, 'MATHE-SHERIFF', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffdd00',
      stroke: '#7a4400',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(10);

    // Title bounce tween
    this.tweens.add({
      targets: this._titleText,
      y: 96,
      yoyo: true,
      duration: 900,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Sheriff star decoration
    this._star = this.add.image(W / 2, 210, 'sheriff_star')
      .setScale(1.0)
      .setDepth(10);

    this.tweens.add({
      targets: this._star,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    });

    // Play button
    this._playBtn = this._makeButton(W / 2, 320, '  JETZT SPIELEN  ', 0x22aa44, 0x33cc55);
    this._playBtn.on('pointerdown', () => {
      this.scene.start('ProfileScene');
    });

    // Stats box
    this._buildStatsBox();

    // Bottom buttons
    this._makeSmallButton(W / 2 - 140, 480, 'Credits', () => {
      this.scene.start('CreditsScene');
    });

    // Cloud animation update
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: this._moveClouds,
      callbackScope: this,
    });
  }

  _makeButton(x, y, label, colorBase, colorHover) {
    const container = this.add.container(x, y).setDepth(20);

    const bg = this.add.rectangle(0, 0, 280, 56, colorBase, 1)
      .setStrokeStyle(3, 0xffffff, 0.6);

    const text = this.add.text(0, 0, label, {
      fontSize: '26px',
      fontFamily: 'Arial Black, Arial',
      fill: '#ffffff',
      stroke: '#006600',
      strokeThickness: 4,
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(280, 56);
    container.setInteractive();

    container.on('pointerover', () => {
      bg.setFillStyle(colorHover);
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    container.on('pointerout', () => {
      bg.setFillStyle(colorBase);
      this.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });

    return container;
  }

  _makeSmallButton(x, y, label, callback) {
    const container = this.add.container(x, y).setDepth(20);

    const bg = this.add.rectangle(0, 0, 160, 36, 0x224488, 1)
      .setStrokeStyle(2, 0x88aadd, 0.7);

    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ddddff',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(160, 36);
    container.setInteractive();
    container.on('pointerdown', callback);
    container.on('pointerover', () => bg.setFillStyle(0x3366aa));
    container.on('pointerout',  () => bg.setFillStyle(0x224488));

    return container;
  }

  _buildStatsBox() {
    const W = 960;
    const profiles = window.ProfileSystem ? ProfileSystem.getProfiles() : [];

    let totalStars = 0;
    let maxLevel   = 1;
    profiles.forEach(p => {
      const stars   = p.levelStars  ? Object.values(p.levelStars).reduce((a, b) => a + b, 0) : 0;
      const unlocked = p.currentLevel  || 1;
      totalStars += stars;
      if (unlocked > maxLevel) maxLevel = unlocked;
    });

    const boxW = 320, boxH = 80;
    const boxX = W / 2, boxY = 420;

    // Box background
    this.add.rectangle(boxX, boxY, boxW, boxH, 0x000033, 0.7)
      .setStrokeStyle(2, 0x4466aa, 0.8)
      .setDepth(15);

    // Title
    this.add.text(boxX, boxY - 26, 'STATISTIK', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fill: '#aaccff',
    }).setOrigin(0.5).setDepth(16);

    // Stats line 1
    this.add.text(boxX, boxY - 10, 'Profile: ' + profiles.length + '   |   Sterne: ' + totalStars, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
    }).setOrigin(0.5).setDepth(16);

    // Stats line 2
    this.add.text(boxX, boxY + 12, 'Hoechstes Level: ' + maxLevel, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffcc44',
    }).setOrigin(0.5).setDepth(16);
  }

  _moveClouds() {
    if (!this._clouds) return;
    this._clouds.forEach(cloud => {
      cloud.x -= 0.4;
      if (cloud.x < -100) {
        cloud.x = 1060;
        cloud.y = Phaser.Math.Between(30, 140);
      }
    });
  }
}
