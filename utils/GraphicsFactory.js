// =============================================================
// utils/GraphicsFactory.js - Mathe-Shooter
// Generates all game textures programmatically via Phaser Graphics.
// Call GraphicsFactory.createAll(scene) from BootScene.preload().
// =============================================================

window.GraphicsFactory = {

  createAll(scene) {
    this._createPlayers(scene);
    this._createEnemies(scene);
    this._createBullets(scene);
    this._createPlatforms(scene);
    this._createChests(scene);
    this._createWeaponItems(scene);
    this._createShieldItem(scene);
    this._createCheckpoints(scene);
    this._createHUD(scene);
    this._createBackground(scene);
    this._createThemeBackgrounds(scene);
    this._createWallTile(scene);
    this._createSheriffStar(scene);
    this._createUI(scene);
  },

  _drawHeart(g, x, y, size, color) {
    g.fillStyle(color, 1);
    const s = Math.floor(size / 8);
    g.fillRect(x + s,       y,           s * 2, s);
    g.fillRect(x + s * 4,   y,           s * 2, s);
    g.fillRect(x,           y + s,       s * 7, s);
    g.fillRect(x,           y + s * 2,   s * 7, s);
    g.fillRect(x,           y + s * 3,   s * 7, s);
    g.fillRect(x + s,       y + s * 4,   s * 5, s);
    g.fillRect(x + s * 2,   y + s * 5,   s * 3, s);
    g.fillRect(x + s * 3,   y + s * 6,   s,     s);
  },

  _drawStar(g, cx, cy, outerR, innerR, points, color, alpha) {
    alpha = alpha === undefined ? 1 : alpha;
    g.fillStyle(color, alpha);
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
  },

  // Player textures (48x64) — cowboy sheriff
  _createPlayers(scene) {
    const configs = [
      { key: 'player',        bodyColor: 0x2266dd, pantsColor: 0x1a4488 },
      { key: 'player_red',    bodyColor: 0xdd3333, pantsColor: 0x992222 },
      { key: 'player_green',  bodyColor: 0x22aa33, pantsColor: 0x166622 },
      { key: 'player_yellow', bodyColor: 0xddaa00, pantsColor: 0x997700 },
    ];

    configs.forEach(cfg => {
      const g = scene.add.graphics();
      const W = 48, H = 64;

      // Cowboy hat crown (dark brown)
      g.fillStyle(0x6b3d0f, 1);
      g.fillRect(12, 1,  24, 14);
      g.fillRect(14, 0,  20, 3);
      // Hat brim (light tan)
      g.fillStyle(0xd4a055, 1);
      g.fillRect(4,  13, 40, 5);
      // Hat band
      g.fillStyle(0x3d1a00, 1);
      g.fillRect(12, 12, 24, 3);
      // Hat highlight
      g.fillStyle(0x8b5220, 0.6);
      g.fillRect(14, 2,  10, 4);

      // Face (skin tone)
      g.fillStyle(0xffddaa, 1);
      g.fillRect(13, 18, 22, 18);
      g.fillRect(11, 20, 26, 14);
      // Eyes white
      g.fillStyle(0xffffff, 1);
      g.fillRect(14, 21, 7, 6);
      g.fillRect(27, 21, 7, 6);
      // Pupils
      g.fillStyle(0x222244, 1);
      g.fillRect(16, 22, 3, 4);
      g.fillRect(29, 22, 3, 4);
      // Eye shine
      g.fillStyle(0xffffff, 1);
      g.fillRect(16, 22, 1, 1);
      g.fillRect(29, 22, 1, 1);
      // Eyebrows
      g.fillStyle(0x5c2d00, 1);
      g.fillRect(14, 19, 8, 2);
      g.fillRect(26, 19, 8, 2);
      // Nose
      g.fillStyle(0xddaa88, 1);
      g.fillRect(22, 28, 4, 3);
      g.fillRect(20, 30, 8, 2);
      // Smile
      g.fillStyle(0xcc8855, 1);
      g.fillRect(17, 34, 14, 2);
      g.fillRect(16, 33, 2,  2);
      g.fillRect(30, 33, 2,  2);

      // Body / Jacket
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(10, 36, 28, 16);
      g.fillRect(8,  38, 32, 12);
      // Jacket details
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(22, 37, 4,  15);
      g.fillRect(10, 37, 8,  15);
      g.fillRect(30, 37, 8,  15);
      // Jacket buttons
      g.fillStyle(0xffcc00, 1);
      g.fillRect(23, 40, 2, 2);
      g.fillRect(23, 45, 2, 2);
      g.fillRect(23, 50, 2, 2);
      // Sheriff star on chest (6-pointed)
      this._drawStar(g, 16, 43, 5, 2, 6, 0xffdd00, 1);

      // Arms
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(0,  37, 8, 14);
      g.fillRect(40, 37, 8, 14);
      // Cuffs
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(0,  48, 8, 2);
      g.fillRect(40, 48, 8, 2);
      // Hands
      g.fillStyle(0xffddaa, 1);
      g.fillRect(0,  50, 8, 6);
      g.fillRect(40, 50, 8, 6);

      // Belt
      g.fillStyle(0x3d1a00, 1);
      g.fillRect(8, 52, 32, 3);
      g.fillStyle(0xffcc00, 1);
      g.fillRect(21, 52, 6, 3);

      // Pants
      g.fillStyle(cfg.pantsColor, 1);
      g.fillRect(10, 55, 12, 6);
      g.fillRect(26, 55, 12, 6);
      // Boots
      g.fillStyle(0x2a1400, 1);
      g.fillRect(8,  59, 14, 5);
      g.fillRect(26, 59, 14, 5);
      // Boot highlights
      g.fillStyle(0x5c3010, 1);
      g.fillRect(9,  59, 6, 2);
      g.fillRect(27, 59, 6, 2);
      // Spurs
      g.fillStyle(0xccaa00, 1);
      g.fillRect(8,  63, 4, 1);
      g.fillRect(26, 63, 4, 1);

      g.generateTexture(cfg.key, W, H);
      g.destroy();
    });
  },

  // Enemy textures
  _createEnemies(scene) {
    // BasicEnemy (40x40): red slime with big evil eyes and horns
    {
      const g = scene.add.graphics();
      const W = 40, H = 40;

      g.fillStyle(0xee2222, 1);
      g.fillRect(4, 10, 32, 26);
      g.fillRect(2, 14, 36, 20);
      g.fillRect(6, 8,  28, 28);
      g.fillRect(8, 6,  24, 30);
      // Side shading
      g.fillStyle(0xaa1111, 1);
      g.fillRect(2,  14, 4, 20);
      g.fillRect(34, 14, 4, 20);
      // Gloss highlight
      g.fillStyle(0xff7777, 0.7);
      g.fillCircle(20, 12, 7);
      g.fillStyle(0xffaaaa, 0.5);
      g.fillCircle(18, 10, 3);

      // Horns
      g.fillStyle(0xcc0000, 1);
      g.fillRect(8,  2, 5, 8);
      g.fillRect(27, 2, 5, 8);
      g.fillRect(9,  0, 3, 4);
      g.fillRect(28, 0, 3, 4);
      g.fillStyle(0x880000, 1);
      g.fillRect(8,  2, 2, 8);
      g.fillRect(27, 2, 2, 8);

      // Eyes white
      g.fillStyle(0xffffff, 1);
      g.fillRect(5,  12, 14, 10);
      g.fillRect(21, 12, 14, 10);
      // Irises (evil red)
      g.fillStyle(0xff0000, 1);
      g.fillRect(8,  13, 8, 8);
      g.fillRect(24, 13, 8, 8);
      // Pupils
      g.fillStyle(0x000000, 1);
      g.fillRect(10, 14, 4, 6);
      g.fillRect(26, 14, 4, 6);
      // Eye shine
      g.fillStyle(0xffffff, 1);
      g.fillRect(10, 14, 2, 2);
      g.fillRect(26, 14, 2, 2);
      // Eyelashes (angry)
      g.fillStyle(0x000000, 1);
      g.fillRect(5,  10, 4, 3);
      g.fillRect(10, 9,  3, 3);
      g.fillRect(27, 9,  3, 3);
      g.fillRect(32, 10, 3, 3);

      // Mouth
      g.fillStyle(0x880000, 1);
      g.fillRect(11, 28, 18, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRect(14, 28, 5, 6);
      g.fillRect(21, 28, 5, 6);

      g.generateTexture('basic_enemy', W, H);
      g.destroy();
    }

    // StrongEnemy (52x52): purple ogre with armor plates
    {
      const g = scene.add.graphics();
      const W = 52, H = 52;

      g.fillStyle(0x7733aa, 1);
      g.fillRect(6,  10, 40, 38);
      g.fillRect(4,  14, 44, 30);
      g.fillRect(8,  8,  36, 40);
      g.fillRect(10, 6,  32, 42);
      // Side shading
      g.fillStyle(0x4d1d77, 1);
      g.fillRect(4,  14, 6, 30);
      g.fillRect(42, 14, 6, 30);
      // Bottom shading
      g.fillStyle(0x5a2288, 1);
      g.fillRect(6, 40, 40, 8);

      // Armor shoulder plates
      g.fillStyle(0x666677, 1);
      g.fillRect(0,  10, 12, 10);
      g.fillRect(40, 10, 12, 10);
      g.fillStyle(0x444455, 1);
      g.fillRect(0,  10, 3, 10);
      g.fillRect(40, 10, 3, 10);
      g.fillStyle(0x9999aa, 1);
      g.fillRect(2,  10, 5, 3);
      g.fillRect(42, 10, 5, 3);

      // Thick eyebrows
      g.fillStyle(0x220044, 1);
      g.fillRect(8,  14, 16, 5);
      g.fillRect(9,  12, 12, 3);
      g.fillRect(28, 14, 16, 5);
      g.fillRect(31, 12, 12, 3);
      // Eyes – deep red
      g.fillStyle(0xdd2222, 1);
      g.fillRect(9,  18, 14, 10);
      g.fillRect(29, 18, 14, 10);
      // Pupils
      g.fillStyle(0x110000, 1);
      g.fillRect(13, 19, 6, 8);
      g.fillRect(33, 19, 6, 8);
      // Eye glow
      g.fillStyle(0xff6600, 1);
      g.fillRect(14, 21, 3, 4);
      g.fillRect(34, 21, 3, 4);

      // Nose
      g.fillStyle(0x5d2388, 1);
      g.fillRect(21, 28, 10, 6);
      g.fillRect(19, 30, 14, 4);

      // Mouth – frown with teeth
      g.fillStyle(0x110022, 1);
      g.fillRect(10, 36, 32, 8);
      g.fillStyle(0xddeedd, 1);
      g.fillRect(11, 36, 6, 5);
      g.fillRect(19, 36, 5, 4);
      g.fillRect(28, 36, 6, 5);
      g.fillRect(37, 36, 5, 4);

      // Head spikes
      g.fillStyle(0x5a2288, 1);
      g.fillRect(12, 2, 6, 8);
      g.fillRect(23, 0, 6, 8);
      g.fillRect(34, 2, 6, 8);

      g.generateTexture('strong_enemy', W, H);
      g.destroy();
    }

    // Boss (80x100): imposing wizard with detailed robe
    {
      const g = scene.add.graphics();
      const W = 80, H = 100;

      // Long robe
      g.fillStyle(0x7a0000, 1);
      g.fillRect(16, 44, 48, 56);
      g.fillRect(12, 50, 56, 48);
      g.fillRect(10, 56, 60, 42);
      // Robe shading
      g.fillStyle(0x4d0000, 1);
      g.fillRect(10, 50, 8, 48);
      g.fillRect(62, 50, 8, 48);
      // Robe center fold
      g.fillStyle(0x5a0000, 1);
      g.fillRect(38, 44, 4, 56);
      // Math symbols on robe (golden)
      g.fillStyle(0xffaa00, 1);
      g.fillRect(16, 60, 8, 2);  g.fillRect(19, 57, 2, 8);   // x symbol
      g.fillRect(54, 58, 8, 2);  g.fillRect(57, 55, 2, 8);   // + symbol
      g.fillRect(26, 72, 8, 2);                               // division line
      g.fillCircle(30, 69, 2);   g.fillCircle(30, 77, 2);    // division dots
      g.fillRect(46, 72, 8, 2);                               // minus
      this._drawStar(g, 40, 85, 6, 2, 6, 0xffaa00, 1);
      // Robe hem trim
      g.fillStyle(0xffcc00, 1);
      g.fillRect(10, 96, 60, 3);
      // Shoulders
      g.fillStyle(0x7a0000, 1);
      g.fillRect(12, 44, 56, 12);

      // Golden diadem
      g.fillStyle(0xffcc00, 1);
      g.fillRect(20, 26, 40, 4);
      g.fillRect(22, 22, 4, 6); g.fillRect(30, 21, 4, 7); g.fillRect(38, 20, 4, 8);
      g.fillRect(46, 21, 4, 7); g.fillRect(54, 22, 4, 6);
      g.fillStyle(0xff2222, 1); g.fillRect(23, 24, 2, 2);
      g.fillStyle(0x2255ff, 1); g.fillRect(39, 24, 2, 2);
      g.fillStyle(0x22cc44, 1); g.fillRect(55, 24, 2, 2);

      // Head
      g.fillStyle(0xffccaa, 1);
      g.fillRect(22, 28, 36, 20);
      g.fillRect(20, 30, 40, 16);
      // Eyebrows
      g.fillStyle(0x220000, 1);
      g.fillRect(22, 31, 14, 3); g.fillRect(24, 29, 10, 3);
      g.fillRect(44, 31, 14, 3); g.fillRect(46, 29, 10, 3);
      // Eyes – glowing yellow
      g.fillStyle(0xffdd00, 1);
      g.fillRect(24, 34, 10, 7);
      g.fillRect(46, 34, 10, 7);
      // Pupils
      g.fillStyle(0x000000, 1);
      g.fillRect(27, 34, 4, 7);
      g.fillRect(49, 34, 4, 7);
      // Eye glow
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(25, 35, 3, 2);
      g.fillRect(47, 35, 3, 2);
      // Nose
      g.fillStyle(0xddaa88, 1);
      g.fillRect(36, 40, 8, 5);
      g.fillRect(34, 43, 12, 3);
      // Sinister smile
      g.fillStyle(0x110000, 1);
      g.fillRect(25, 47, 30, 4);
      g.fillStyle(0xeeeebb, 1);
      g.fillRect(26, 47, 4, 2); g.fillRect(32, 47, 4, 2);
      g.fillRect(44, 47, 4, 2); g.fillRect(50, 47, 4, 2);

      // Wizard hat
      g.fillStyle(0x1a0044, 1);
      g.fillRect(10, 20, 60, 10);
      g.fillRect(22, 6,  36, 16);
      g.fillRect(26, 0,  28, 10);
      g.fillRect(30, 0,  20, 4);
      // Hat band
      g.fillStyle(0xffaa00, 1);
      g.fillRect(12, 18, 56, 4);
      // Stars on hat
      this._drawStar(g, 40, 8,  5, 2, 5, 0xffee88, 1);
      this._drawStar(g, 28, 14, 3, 1, 5, 0xffcc44, 1);
      this._drawStar(g, 52, 14, 3, 1, 5, 0xffcc44, 1);

      // Wand
      g.fillStyle(0x3d1100, 1);
      g.fillRect(68, 40, 5, 36);
      g.fillStyle(0xffcc00, 1);
      g.fillRect(65, 34, 11, 10);
      g.fillRect(63, 36, 14,  6);
      g.fillStyle(0xffffff, 1);
      g.fillRect(68, 35, 3, 3);
      g.fillStyle(0xffee88, 0.8);
      g.fillRect(62, 34, 2, 2);
      g.fillRect(76, 36, 2, 2);
      g.fillStyle(0xff8800, 0.6);
      g.fillRect(64, 32, 2, 2);
      g.fillRect(74, 32, 2, 2);
      // Left sleeve
      g.fillStyle(0x7a0000, 1);
      g.fillRect(4, 44, 12, 10);

      g.generateTexture('boss', W, H);
      g.destroy();
    }
  },

  _createBullets(scene) {
    { const g = scene.add.graphics(); g.fillStyle(0xffee00,1); g.fillCircle(4,4,4); g.fillStyle(0xffffff,1); g.fillCircle(3,3,1); g.generateTexture('bullet',8,8); g.destroy(); }
    { const g = scene.add.graphics(); g.fillStyle(0xff2222,1); g.fillCircle(4,4,4); g.fillStyle(0xff8888,1); g.fillCircle(3,3,1); g.generateTexture('enemy_bullet',8,8); g.destroy(); }
    { const g = scene.add.graphics(); g.fillStyle(0xcc0000,1); g.fillCircle(5,5,5); g.fillStyle(0xff4444,1); g.fillCircle(4,4,2); g.fillStyle(0xffaaaa,1); g.fillCircle(3,3,1); g.generateTexture('boss_bullet',10,10); g.destroy(); }
  },

  _createPlatforms(scene) {
    const widths = [32, 64, 96, 128, 192, 256, 384, 512];
    const H = 16;
    widths.forEach(W => {
      const g = scene.add.graphics();
      g.fillStyle(0x7a4e28, 1);
      g.fillRect(0, 4, W, H - 4);
      g.fillStyle(0x5c3a18, 1);
      for (let x = 0; x < W; x += 14) {
        g.fillRect(x,     5, 2, H - 5);
        g.fillRect(x + 4, 6, 1, H - 7);
      }
      g.fillStyle(0x3d2008, 1);
      g.fillRect(0, H - 3, W, 3);
      g.fillStyle(0x3d9922, 1);
      g.fillRect(0, 0, W, 5);
      g.fillStyle(0x66cc44, 1);
      g.fillRect(0, 0, W, 2);
      g.fillStyle(0x44bb22, 1);
      for (let x = 4; x < W - 4; x += 10) {
        g.fillRect(x,     0, 2, 3);
        g.fillRect(x - 2, 1, 2, 2);
        g.fillRect(x + 2, 1, 2, 2);
      }
      g.generateTexture('platform_' + W, W, H);
      g.destroy();
    });

    {
      const g = scene.add.graphics();
      const W = 960, H = 32;
      g.fillStyle(0x7a4e28, 1); g.fillRect(0, 8, W, H - 8);
      g.fillStyle(0x5c3a18, 1);
      for (let x = 0; x < W; x += 28) { g.fillRect(x, 10, 3, H-10); g.fillRect(x+8, 12, 2, H-13); }
      g.fillStyle(0x3d2008, 1); g.fillRect(0, H-4, W, 4);
      g.fillStyle(0x3d9922, 1); g.fillRect(0, 0, W, 9);
      g.fillStyle(0x66cc44, 1); g.fillRect(0, 0, W, 3);
      g.fillStyle(0x44bb22, 1);
      for (let x = 6; x < W-6; x += 16) { g.fillRect(x,0,3,5); g.fillRect(x-3,2,3,3); g.fillRect(x+3,2,3,3); }
      g.generateTexture('ground', W, H);
      g.destroy();
    }
  },

  _createChests(scene) {
    const chests = [
      { key: 'chest_easy',   bodyColor: 0x228833, lidColor: 0x33aa44, lockColor: 0xffdd00 },
      { key: 'chest_medium', bodyColor: 0x2244aa, lidColor: 0x3366cc, lockColor: 0xffdd00 },
      { key: 'chest_hard',   bodyColor: 0x6622aa, lidColor: 0x9933cc, lockColor: 0xffdd00 },
      { key: 'chest_open',   bodyColor: 0x333333, lidColor: 0x555555, lockColor: 0x888888 },
    ];
    chests.forEach(cfg => {
      const g = scene.add.graphics();
      const W = 40, H = 40;
      g.fillStyle(cfg.bodyColor,1); g.fillRect(2,18,36,20);
      g.fillStyle(0x000000,0.3); g.fillRect(2,36,36,2); g.fillRect(36,18,2,20);
      g.fillStyle(0xddaa00,1); g.fillRect(2,25,36,4);
      g.fillStyle(cfg.lidColor,1); g.fillRect(2,6,36,14);
      g.fillStyle(0xffffff,0.2); g.fillRect(3,7,34,4);
      g.fillStyle(0xddaa00,1); g.fillRect(2,18,36,2); g.fillRect(2,6,36,2); g.fillRect(2,6,2,14); g.fillRect(36,6,2,14);
      g.fillStyle(0xbbaa00,1); g.fillRect(5,17,6,4); g.fillRect(29,17,6,4);
      g.fillStyle(cfg.lockColor,1); g.fillRect(16,20,8,7); g.fillRect(17,16,2,6); g.fillRect(21,16,2,6); g.fillRect(17,15,6,3);
      g.fillStyle(0x000000,1); g.fillRect(19,22,2,4); g.fillCircle(20,22,2);
      if (cfg.key === 'chest_open') {
        g.fillStyle(cfg.lidColor,1); g.fillRect(4,2,32,8);
        g.fillStyle(0x000000,0.5); g.fillRect(4,16,32,6);
        g.fillStyle(0xffee88,0.6); g.fillRect(8,17,24,3);
      }
      g.generateTexture(cfg.key, W, H);
      g.destroy();
    });
  },

  // Weapon item pickups: 11 distinctive textures (32x32) + tier fallbacks
  _createWeaponItems(scene) {
    // club
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x7a4e28,1); g.fillRect(4,18,5,12); g.fillRect(5,14,5,6);
      g.fillStyle(0x5c3a18,1); g.fillRect(8,4,14,14); g.fillRect(6,6,16,10);
      g.fillStyle(0x3d2008,1); g.fillRect(9,5,2,12); g.fillRect(13,5,2,12); g.fillRect(17,5,2,12);
      g.fillStyle(0x888888,1); g.fillRect(7,14,16,3);
      g.fillStyle(0xaa7744,0.5); g.fillRect(9,5,5,4);
      g.generateTexture('weapon_item_club',W,H); g.destroy(); }

    // slingshot
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x7a4e28,1); g.fillRect(13,16,6,14); g.fillRect(4,6,5,14); g.fillRect(4,6,10,5); g.fillRect(23,6,5,14); g.fillRect(18,6,10,5);
      g.fillStyle(0x5c3a18,1); g.fillRect(5,7,2,12); g.fillRect(25,7,2,12); g.fillRect(14,17,2,12);
      g.fillStyle(0x222222,1); g.fillRect(8,4,16,2); g.fillRect(8,4,2,4); g.fillRect(22,4,2,4);
      g.fillStyle(0x555555,1); g.fillRect(13,3,6,4);
      g.generateTexture('weapon_item_slingshot',W,H); g.destroy(); }

    // squirt gun
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x44aadd,1); g.fillRect(4,10,20,8); g.fillRect(8,16,7,10);
      g.fillStyle(0x2288bb,1); g.fillRect(22,12,8,4);
      g.fillStyle(0x66ccee,1); g.fillRect(4,6,10,6); g.fillRect(6,4,6,4);
      g.fillStyle(0xaaddff,0.6); g.fillRect(5,10,6,3);
      g.fillStyle(0x1166aa,1); g.fillRect(11,16,3,6); g.fillRect(12,21,4,2);
      g.fillStyle(0x88ddff,0.8); g.fillCircle(30,14,2);
      g.generateTexture('weapon_item_squirt',W,H); g.destroy(); }

    // snowball
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0xeeeeff,1); g.fillCircle(16,16,13);
      g.fillStyle(0xffffff,1); g.fillCircle(13,13,5);
      g.fillStyle(0xaabbdd,1); g.fillRect(14,8,4,16); g.fillRect(8,14,16,4);
      g.fillRect(10,10,3,3); g.fillRect(19,10,3,3); g.fillRect(10,19,3,3); g.fillRect(19,19,3,3);
      g.fillStyle(0x8899cc,1); g.fillRect(14,14,4,4);
      g.generateTexture('weapon_item_snowball',W,H); g.destroy(); }

    // wood_pistol
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x7a4e28,1); g.fillRect(6,16,8,12); g.fillRect(7,26,9,4);
      g.fillStyle(0x5c3a18,1); g.fillRect(6,10,18,8);
      g.fillStyle(0x7a4e28,1); g.fillRect(22,12,8,4);
      g.fillStyle(0x3d2008,1); g.fillRect(7,11,2,6); g.fillRect(11,11,2,6); g.fillRect(15,11,2,6); g.fillRect(7,17,2,10); g.fillRect(10,17,2,10);
      g.fillStyle(0x3d2008,1); g.fillRect(10,17,3,6); g.fillRect(11,22,4,2);
      g.fillStyle(0x999999,1); g.fillRect(20,9,2,2);
      g.generateTexture('weapon_item_wood_pistol',W,H); g.destroy(); }

    // fire_pistol
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0xff6600,0.35); g.fillRect(18,4,10,12);
      g.fillStyle(0xffcc00,0.25); g.fillRect(20,2,6,8);
      g.fillStyle(0x333344,1); g.fillRect(6,16,8,12);
      g.fillStyle(0x444455,1); g.fillRect(6,10,18,8);
      g.fillStyle(0x222233,1); g.fillRect(22,12,8,4);
      g.fillStyle(0xff4400,1); g.fillRect(28,8,3,8);
      g.fillStyle(0xff8800,1); g.fillRect(29,6,2,6);
      g.fillStyle(0xffcc00,1); g.fillRect(29,4,2,4);
      g.fillStyle(0x222233,1); g.fillRect(10,17,3,6); g.fillRect(11,22,4,2);
      g.fillStyle(0x6666aa,0.5); g.fillRect(7,10,12,3);
      g.generateTexture('weapon_item_fire_pistol',W,H); g.destroy(); }

    // double_shot
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x333344,1); g.fillRect(6,18,9,11);
      g.fillStyle(0x555566,1); g.fillRect(6,8,22,5); g.fillRect(6,15,22,5);
      g.fillStyle(0x222233,1); g.fillRect(26,8,4,5); g.fillRect(26,15,4,5); g.fillRect(6,13,20,2);
      g.fillStyle(0x444455,1); g.fillRect(10,20,3,6); g.fillRect(11,25,4,2);
      g.fillStyle(0x8888aa,0.5); g.fillRect(7,8,10,2); g.fillRect(7,15,10,2);
      g.generateTexture('weapon_item_double_shot',W,H); g.destroy(); }

    // ice_cannon
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x2255aa,1); g.fillRect(4,11,20,10); g.fillRect(2,13,22,6);
      g.fillStyle(0x1a3d88,1); g.fillRect(20,10,4,12);
      g.fillStyle(0x88ddff,1); g.fillRect(24,12,6,8); g.fillRect(26,10,4,12); g.fillRect(28,8,2,16);
      g.fillStyle(0xffffff,0.7); g.fillRect(25,12,2,3);
      g.fillStyle(0xaaeeff,0.8); g.fillRect(30,10,2,2); g.fillRect(30,18,2,2);
      g.fillStyle(0x1a3d88,1); g.fillRect(6,20,8,8);
      g.fillStyle(0x6699cc,1); g.fillRect(6,12,3,8); g.fillRect(12,12,3,8);
      g.generateTexture('weapon_item_ice_cannon',W,H); g.destroy(); }

    // lightning
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0xffee00,0.3); g.fillRect(6,2,22,28);
      g.fillStyle(0xffee00,1); g.fillRect(10,4,16,5); g.fillRect(14,8,5,4); g.fillRect(11,11,5,4); g.fillRect(8,14,5,4); g.fillRect(6,17,16,5);
      g.fillStyle(0xffffff,0.9); g.fillRect(11,5,10,3); g.fillRect(14,9,3,3); g.fillRect(11,12,3,3); g.fillRect(8,15,3,3); g.fillRect(7,18,10,3);
      g.fillStyle(0xffee88,0.6); g.fillRect(4,2,3,3); g.fillRect(25,22,3,3);
      g.generateTexture('weapon_item_lightning',W,H); g.destroy(); }

    // rocket
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0x555566,1); g.fillRect(2,11,24,10); g.fillRect(0,13,26,6);
      g.fillStyle(0x222233,1); g.fillRect(22,10,4,12);
      g.fillStyle(0xcc3333,1); g.fillRect(4,13,18,6);
      g.fillStyle(0xeeaaaa,1); g.fillRect(20,13,3,6); g.fillRect(21,12,2,8); g.fillRect(22,11,1,10);
      g.fillStyle(0xff6666,1); g.fillRect(10,13,4,6);
      g.fillStyle(0xff4400,1); g.fillRect(0,12,5,8);
      g.fillStyle(0xff8800,1); g.fillRect(0,13,4,6);
      g.fillStyle(0xffcc00,1); g.fillRect(0,14,3,4);
      g.fillStyle(0x444455,1); g.fillRect(8,20,8,10);
      g.generateTexture('weapon_item_rocket',W,H); g.destroy(); }

    // super_cannon
    { const g = scene.add.graphics(); const W=32,H=32;
      g.fillStyle(0xcc8800,1); g.fillRect(2,10,22,12); g.fillRect(0,12,24,8);
      g.fillStyle(0xaa6600,1); g.fillRect(20,8,6,16); g.fillRect(22,6,4,20);
      g.fillStyle(0xffcc44,0.7); g.fillRect(3,11,14,4);
      g.fillStyle(0xffaa00,1); g.fillRect(6,10,3,12); g.fillRect(14,10,3,12);
      this._drawStar(g, 10, 18, 3, 1, 5, 0xffee44, 1);
      g.fillStyle(0xaa6600,1); g.fillRect(4,22,12,8); g.fillRect(2,26,16,4);
      g.fillStyle(0x885500,1); g.fillCircle(8,28,4); g.fillCircle(14,28,4);
      g.fillStyle(0xffcc44,0.4); g.fillCircle(8,28,2); g.fillCircle(14,28,2);
      g.generateTexture('weapon_item_super_cannon',W,H); g.destroy(); }

    // Tier fallbacks (backward compat)
    [
      { key: 'weapon_item',    color: 0xaaaaaa, trim: 0xffffff },
      { key: 'weapon_item_t1', color: 0x44ff44, trim: 0xaaffaa },
      { key: 'weapon_item_t2', color: 0x4488ff, trim: 0xaaccff },
      { key: 'weapon_item_t3', color: 0xaa44ff, trim: 0xddaaff },
    ].forEach(cfg => {
      const g = scene.add.graphics(); const W=24,H=24;
      g.fillStyle(0x444444,1); g.fillRect(4,12,8,8);
      g.fillStyle(cfg.color,1); g.fillRect(4,8,16,6); g.fillRect(18,9,4,4);
      g.fillStyle(cfg.trim,1); g.fillRect(5,6,14,3);
      g.fillStyle(0x333333,1); g.fillRect(8,14,5,5); g.fillRect(9,18,3,2);
      g.fillStyle(cfg.color,1); g.fillRect(6,9,3,3);
      g.fillStyle(0xffee88,0.5); g.fillRect(20,9,3,3);
      g.generateTexture(cfg.key,W,H); g.destroy();
    });
  },

  _createShieldItem(scene) {
    const g = scene.add.graphics(); const W=24,H=24;
    g.fillStyle(0xddaa00,1); g.fillRect(4,2,16,16); g.fillRect(6,16,12,4); g.fillRect(8,18,8,3); g.fillRect(10,20,4,3);
    g.fillStyle(0xffcc22,1); g.fillRect(6,4,12,12); g.fillRect(7,14,10,3); g.fillRect(9,16,6,2);
    g.fillStyle(0xddaa00,1); g.fillRect(9,8,6,6);
    g.fillStyle(0xffffff,1); g.fillRect(11,10,2,2);
    g.fillStyle(0xddaa00,1); g.fillRect(11,4,2,10); g.fillRect(6,9,12,2);
    g.generateTexture('shield_item',W,H); g.destroy();
  },

  _createCheckpoints(scene) {
    {
      const g = scene.add.graphics(); const W=16,H=48;
      g.fillStyle(0x888888,1); g.fillRect(7,0,3,48);
      g.fillStyle(0x999999,1); g.fillRect(10,4,12,8); g.fillRect(10,10,10,6); g.fillRect(10,14,7,4);
      g.fillStyle(0x666666,1); g.fillRect(10,3,12,1); g.fillRect(10,3,1,12); g.fillRect(4,44,8,4);
      g.generateTexture('checkpoint_inactive',W,H); g.destroy();
    }
    {
      const g = scene.add.graphics(); const W=16,H=48;
      g.fillStyle(0xaaaaaa,1); g.fillRect(7,0,3,48);
      g.fillStyle(0x22cc44,1); g.fillRect(10,2,12,8); g.fillRect(10,8,14,6); g.fillRect(10,12,11,5);
      g.fillStyle(0x55ee66,1); g.fillRect(11,3,10,3);
      g.fillStyle(0x008822,1); g.fillRect(10,2,12,1); g.fillRect(10,2,1,14);
      this._drawStar(g,16,9,3,1,5,0xffee00,1);
      g.fillStyle(0x777777,1); g.fillRect(4,44,8,4);
      g.generateTexture('checkpoint_active',W,H); g.destroy();
    }
  },

  _createHUD(scene) {
    {
      const g = scene.add.graphics();
      this._drawHeart(g, 1, 5, 30, 0xee1111);
      g.fillStyle(0xff8888,1); const s=Math.floor(30/8);
      g.fillRect(1+s,5,s*2,s); g.fillRect(1+s*4,5,s*2,s);
      g.generateTexture('heart_full',32,32); g.destroy();
    }
    {
      const g = scene.add.graphics();
      this._drawHeart(g, 1, 5, 30, 0x888888);
      g.fillStyle(0xee1111,1); const s=Math.floor(30/8);
      g.fillRect(1+s,5,s*2,s);
      g.fillRect(1,5+s,s*3+1,s); g.fillRect(1,5+s*2,s*3+1,s); g.fillRect(1,5+s*3,s*3+1,s);
      g.fillRect(1+s,5+s*4,s*2+1,s); g.fillRect(1+s*2,5+s*5,s+1,s); g.fillRect(1+s*3,5+s*6,1,s);
      g.generateTexture('heart_half',32,32); g.destroy();
    }
    {
      const g = scene.add.graphics();
      this._drawHeart(g, 1, 5, 30, 0x555555);
      g.fillStyle(0x1a1a2e,1); const s=Math.floor(30/8);
      g.fillRect(1+s+2,5+s+2,s*5-4,s-2); g.fillRect(1+2,5+s*2+2,s*7-4,s-2);
      g.fillRect(1+2,5+s*3+2,s*7-4,s-2); g.fillRect(1+s+2,5+s*4+2,s*5-4,s-2);
      g.fillRect(1+s*2+2,5+s*5+2,s*3-4,s-2);
      g.generateTexture('heart_empty',32,32); g.destroy();
    }
    {
      const g = scene.add.graphics(); const W=80,H=40;
      g.fillStyle(0xeeeeff,0.9); g.fillRect(10,20,60,18); g.fillCircle(22,22,12); g.fillCircle(40,16,16); g.fillCircle(58,22,12);
      g.fillStyle(0xffffff,1); g.fillCircle(40,13,10); g.fillCircle(25,19,7); g.fillCircle(55,19,7);
      g.generateTexture('cloud',W,H); g.destroy();
    }
  },

  _createBackground(scene) {
    const g = scene.add.graphics(); const W=960,H=540;
    const steps=20;
    for (let i=0;i<steps;i++) {
      const t=i/steps;
      const r=Math.floor(Phaser.Math.Linear(0x22,0x87,t));
      const gr=Math.floor(Phaser.Math.Linear(0x33,0xcc,t));
      const b=Math.floor(Phaser.Math.Linear(0x66,0xff,t));
      g.fillStyle((r<<16)|(gr<<8)|b,1);
      const sh=Math.ceil(H/steps);
      g.fillRect(0,i*sh,W,sh+1);
    }
    g.fillStyle(0xffffff,0.35);
    g.fillCircle(120,80,30); g.fillCircle(150,70,22); g.fillCircle(100,85,20);
    g.fillCircle(500,120,35); g.fillCircle(535,110,25); g.fillCircle(470,125,22);
    g.fillCircle(820,60,28); g.fillCircle(850,52,20); g.fillCircle(800,65,18);
    g.generateTexture('bg_sky',W,H); g.destroy();
  },

  _createThemeBackgrounds(scene) {
    const W=960,H=540;
    const gradSky=(g,tr,tg,tb,br,bg,bb)=>{
      const steps=18;
      for(let i=0;i<steps;i++){
        const t=i/steps;
        const r=Math.floor(Phaser.Math.Linear(tr,br,t));
        const gr=Math.floor(Phaser.Math.Linear(tg,bg,t));
        const b=Math.floor(Phaser.Math.Linear(tb,bb,t));
        g.fillStyle((r<<16)|(gr<<8)|b,1);
        const sh=Math.ceil(H/steps);
        g.fillRect(0,i*sh,W,sh+1);
      }
    };
    { const g=scene.add.graphics();
      gradSky(g,0x44,0x88,0xdd,0x88,0xcc,0xff);
      g.fillStyle(0x3d9922,1); for(let i=0;i<5;i++) g.fillCircle(i*240+120,430,130);
      g.fillStyle(0x55bb33,1); for(let i=0;i<5;i++) g.fillCircle(i*240+90,420,70);
      g.fillStyle(0x33881a,1); g.fillRect(0,480,W,60);
      [[100,460,0xff4466],[200,468,0xffee22],[350,455,0xff6622],[500,463,0xff44aa],[650,458,0xffdd44],[800,468,0xff2244],[900,453,0xeebb00]].forEach(([fx,fy,fc])=>{g.fillStyle(fc,0.85);g.fillCircle(fx,fy,5);g.fillStyle(0xffffff,0.5);g.fillCircle(fx,fy,2);});
      g.fillStyle(0xffffff,0.85);
      g.fillCircle(150,80,28);g.fillCircle(180,70,20);g.fillCircle(125,88,18);
      g.fillCircle(500,120,32);g.fillCircle(535,110,24);g.fillCircle(470,128,20);
      g.fillCircle(800,60,26);g.fillCircle(832,52,18);
      g.generateTexture('bg_meadow',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x11,0x33,0x11,0x33,0x66,0x22);
      g.fillStyle(0xaabbaa,0.15); g.fillRect(0,360,W,80);
      g.fillStyle(0x0a1a0a,1);
      for(let i=0;i<22;i++){ const tx=i*46+10,th=100+(i%3)*40;
        g.fillRect(tx+8,480-th+60,4,th-60); g.fillRect(tx,480-th,20,28);
        g.fillRect(tx+2,480-th-18,16,22); g.fillRect(tx+4,480-th-34,12,18); g.fillRect(tx+6,480-th-48,8,16);}
      g.fillStyle(0x668866,0.2); g.fillRect(0,440,W,100);
      g.fillStyle(0x112211,1); g.fillRect(0,490,W,50);
      g.generateTexture('bg_forest',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0xcc,0x99,0x55,0xee,0xcc,0x88);
      g.fillStyle(0xcc9944,1); g.fillRect(0,470,W,70);
      g.fillStyle(0xddaa55,1); g.fillRect(0,470,W,10);
      [80,280,680,880].forEach(tx=>{ g.fillStyle(0x887766,1); g.fillRect(tx-20,300,40,175);
        for(let c=0;c<3;c++) g.fillRect(tx-18+c*14,290,10,14);
        g.fillStyle(0x332211,1); g.fillRect(tx-6,340,12,18); });
      g.fillStyle(0x776655,1); g.fillRect(100,380,160,100); g.fillRect(700,380,160,100);
      for(let c=0;c<5;c++){ g.fillStyle(0x887766,1); g.fillRect(100+c*32,370,18,14); g.fillRect(700+c*32,370,18,14); }
      g.generateTexture('bg_courtyard',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x66,0xbb,0x44,0x99,0xdd,0x66);
      g.fillStyle(0x33aa22,1); g.fillRect(0,480,W,60);
      g.fillStyle(0x44cc33,1); g.fillRect(0,480,W,10);
      [50,160,310,460,610,760,910].forEach((bx,i)=>{ const bc=i%2===0?0x228833:0x33aa44;
        g.fillStyle(bc,1); g.fillCircle(bx,472,26); g.fillCircle(bx+20,470,20); g.fillCircle(bx-16,474,18);
        g.fillStyle(0x44cc55,0.5); g.fillCircle(bx-4,464,12); });
      [[120,478,0xffaacc],[240,476,0xffee44],[380,479,0xff6688],[520,477,0xeeaaff],[660,478,0xffcc44],[820,476,0xff88aa]].forEach(([fx,fy,fc])=>{
        g.fillStyle(fc,1); g.fillCircle(fx,fy,6); g.fillCircle(fx+8,fy-4,6); g.fillCircle(fx-8,fy-4,6);
        g.fillStyle(0xffee88,1); g.fillCircle(fx,fy-4,4); });
      g.fillStyle(0x886644,1); g.fillRect(0,462,W,4);
      for(let p=0;p<W;p+=24) g.fillRect(p,450,4,16);
      g.generateTexture('bg_garden',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x08,0x06,0x0e,0x12,0x0c,0x18);
      g.fillStyle(0x222033,0.5);
      for(let x=0;x<W;x+=48) g.fillRect(x,0,2,H);
      for(let y=0;y<H;y+=48) g.fillRect(0,y,W,2);
      g.fillStyle(0x1a1222,1); g.fillRect(0,490,W,50);
      [120,360,600,840].forEach(tx=>{
        g.fillStyle(0xff6600,0.12); g.fillCircle(tx,200,60);
        g.fillStyle(0xff8800,0.07); g.fillCircle(tx,200,90);
        g.fillStyle(0x666666,1); g.fillRect(tx-3,188,6,20); g.fillRect(tx-6,185,12,5);
        g.fillStyle(0xff4400,1); g.fillRect(tx-4,172,8,16);
        g.fillStyle(0xff8800,1); g.fillRect(tx-3,168,6,12);
        g.fillStyle(0xffcc00,1); g.fillRect(tx-2,165,4,8);
        g.fillStyle(0xffffff,0.8); g.fillRect(tx-1,164,2,4); });
      g.generateTexture('bg_dungeon',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x11,0x08,0x2a,0x33,0x22,0x55);
      g.fillStyle(0xffffff,0.7);
      [[80,60],[200,30],[350,80],[500,45],[640,70],[780,35],[900,65],[140,140],[310,120],[460,150],[620,110],[820,145]].forEach(([sx,sy])=>g.fillRect(sx,sy,2,2));
      g.fillStyle(0x442266,0.5);
      g.fillCircle(150,80,40);g.fillCircle(190,72,30);g.fillCircle(120,88,28);
      g.fillCircle(600,100,50);g.fillCircle(645,88,36);g.fillCircle(565,108,30);
      g.fillStyle(0x110022,1); g.fillRect(420,200,120,340); g.fillRect(400,300,160,240);
      for(let c=0;c<6;c++) g.fillRect(420+c*20,190,12,14);
      g.fillStyle(0xffcc44,0.8);
      g.fillRect(450,260,18,24);g.fillRect(490,260,18,24);g.fillRect(450,330,18,24);g.fillRect(490,330,18,24);
      g.fillStyle(0x0e0818,1); g.fillRect(0,490,W,50);
      g.generateTexture('bg_tower',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x00,0x22,0x66,0x11,0x44,0x99);
      g.fillStyle(0xffffff,0.5);
      [[50,40],[180,60],[320,30],[460,55],[590,42],[720,68],[860,38]].forEach(([sx,sy])=>g.fillRect(sx,sy,2,2));
      [{x:0,w:80,h:220},{x:90,w:60,h:160},{x:160,w:100,h:260},{x:270,w:70,h:180},{x:600,w:90,h:240},{x:700,w:60,h:160},{x:770,w:120,h:280},{x:900,w:60,h:200}].forEach(b=>{
        g.fillStyle(0x0a1a2e,1); g.fillRect(b.x,H-b.h,b.w,b.h);
        g.fillStyle(0xffee88,0.6);
        for(let wy=H-b.h+10;wy<H-20;wy+=18)
          for(let wx=b.x+6;wx<b.x+b.w-6;wx+=14)
            if((wx*7+wy*3)%10>3) g.fillRect(wx,wy,6,8); });
      g.fillStyle(0x071020,1); g.fillRect(0,490,W,50);
      g.generateTexture('bg_rooftop',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x22,0x00,0x44,0x55,0x11,0x88);
      const mc=[0xff88ff,0x88ffff,0xffff44,0xff44aa,0x44ffcc];
      for(let i=0;i<60;i++){
        const mx=(i*137+50)%W, my=(i*97+30)%(H-60);
        g.fillStyle(mc[i%mc.length],0.7); g.fillRect(mx,my,3,3);
        g.fillStyle(mc[i%mc.length],0.3); g.fillCircle(mx+1,my+1,4); }
      g.fillStyle(0xaa44ff,0.1); g.fillCircle(480,270,200);
      g.fillStyle(0xdd88ff,0.5);
      g.fillRect(100,180,20,4);g.fillRect(108,172,4,20);
      g.fillRect(800,240,20,4);g.fillRect(808,232,4,20);
      g.fillRect(400,120,20,4);g.fillRect(408,112,4,20);
      g.fillStyle(0x1a0033,1); g.fillRect(0,490,W,50);
      g.generateTexture('bg_wizard',W,H); g.destroy(); }
    { const g=scene.add.graphics();
      gradSky(g,0x04,0x02,0x0a,0x0e,0x06,0x18);
      [60,200,340,620,760,900].forEach(px=>{
        g.fillStyle(0x886600,1); g.fillRect(px-16,120,32,380);
        g.fillStyle(0xcc9900,1); g.fillRect(px-12,120,8,380);
        g.fillStyle(0xffcc44,0.25); g.fillRect(px-8,120,4,380);
        g.fillStyle(0xaa8800,1); g.fillRect(px-24,110,48,14); g.fillRect(px-20,104,40,10); g.fillRect(px-22,494,44,12); });
      g.fillStyle(0x775500,1); g.fillRect(0,100,W,14);
      g.fillStyle(0xaa8800,1); g.fillRect(0,100,W,5);
      g.fillStyle(0x440000,1); g.fillRect(0,490,W,50);
      g.fillStyle(0x660000,1); g.fillRect(300,490,360,50);
      g.fillStyle(0x886600,1); g.fillRect(300,490,360,3);
      g.generateTexture('bg_throne',W,H); g.destroy(); }
  },

  _createWallTile(scene) {
    const g=scene.add.graphics(); const W=32,H=32;
    g.fillStyle(0x888070,1); g.fillRect(0,0,W,H);
    g.fillStyle(0x9a9282,1); g.fillRect(1,1,W-2,H-2);
    g.fillStyle(0x7a7060,0.5); g.fillRect(2,2,12,12); g.fillRect(18,16,12,12);
    g.fillStyle(0x504840,1); g.fillRect(0,0,W,2); g.fillRect(0,H-2,W,2); g.fillRect(0,0,2,H); g.fillRect(W-2,0,2,H);
    g.fillStyle(0x605850,0.6); g.fillRect(2,14,W-4,2);
    g.fillStyle(0xbbaa99,0.5); g.fillRect(2,2,W-4,3); g.fillRect(2,2,3,H-4);
    g.fillStyle(0x447733,0.7); g.fillRect(3,3,5,4); g.fillRect(20,18,7,4);
    g.fillStyle(0x66aa44,0.5); g.fillRect(4,4,3,2); g.fillRect(21,19,4,2);
    g.generateTexture('wall_stone_tile',W,H); g.destroy();
  },

  _createSheriffStar(scene) {
    const g=scene.add.graphics(); const W=80,H=80;
    g.fillStyle(0xffcc00,0.2); g.fillCircle(40,40,38);
    this._drawStar(g,40,40,36,18,6,0xffcc00,1);
    this._drawStar(g,40,40,26,13,6,0xffee44,1);
    g.fillStyle(0xffffff,1); g.fillCircle(40,40,8);
    g.fillStyle(0xffcc00,1); g.fillCircle(40,40,5);
    g.fillStyle(0xffffff,0.6); g.fillRect(30,28,8,6);
    g.generateTexture('sheriff_star',W,H); g.destroy();
  },

  _createUI(scene) {
    { const g=scene.add.graphics(); g.fillStyle(0x000000,0); g.fillRect(0,0,24,24);
      this._drawStar(g,12,12,11,4,5,0xffcc00,1);
      g.fillStyle(0xffee88,0.7); g.fillRect(9,5,4,4);
      g.generateTexture('star_gold',24,24); g.destroy(); }
    { const g=scene.add.graphics();
      this._drawStar(g,12,12,11,4,5,0x666666,1);
      this._drawStar(g,12,12,8,3,5,0x1a1a2e,1);
      g.generateTexture('star_empty',24,24); g.destroy(); }
    { const g=scene.add.graphics(); const W=24,H=24;
      g.fillStyle(0x888888,1); g.fillRect(4,11,16,12);
      g.fillStyle(0xaaaaaa,1); g.fillRect(5,12,14,4);
      g.fillStyle(0x888888,1); g.fillRect(6,4,4,10); g.fillRect(14,4,4,10); g.fillRect(6,2,12,4);
      g.fillStyle(0x1a1a2e,1); g.fillRect(8,4,2,9); g.fillRect(14,4,2,9); g.fillRect(8,2,8,4);
      g.fillStyle(0x333333,1); g.fillCircle(12,16,3); g.fillRect(11,17,2,4);
      g.generateTexture('lock_icon',W,H); g.destroy(); }
  },

};
