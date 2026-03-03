// =============================================================
// utils/GraphicsFactory.js - Mathe-Shooter
// Generates all game textures programmatically via Phaser Graphics.
// Call GraphicsFactory.createAll(scene) from BootScene.preload().
// =============================================================

window.GraphicsFactory = {

  // -----------------------------------------------------------
  // Entry point – creates every texture used in the game
  // -----------------------------------------------------------
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
    this._createUI(scene);
  },

  // -----------------------------------------------------------
  // Helper: draw a simple heart shape using fillRect blocks
  // -----------------------------------------------------------
  _drawHeart(g, x, y, size, color) {
    g.fillStyle(color, 1);
    // Build heart from a grid of filled rectangles
    const s = Math.floor(size / 8);
    // Top two bumps
    g.fillRect(x + s,       y,           s * 2, s);
    g.fillRect(x + s * 4,   y,           s * 2, s);
    // Wide middle rows
    g.fillRect(x,           y + s,       s * 7, s);
    g.fillRect(x,           y + s * 2,   s * 7, s);
    g.fillRect(x,           y + s * 3,   s * 7, s);
    // Narrowing rows
    g.fillRect(x + s,       y + s * 4,   s * 5, s);
    g.fillRect(x + s * 2,   y + s * 5,   s * 3, s);
    g.fillRect(x + s * 3,   y + s * 6,   s,     s);
  },

  // -----------------------------------------------------------
  // Helper: draw a 5-pointed star
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // Player textures  (32 x 48)
  // body color variants: blue, red, green, yellow
  // -----------------------------------------------------------
  _createPlayers(scene) {
    const configs = [
      { key: 'player',        bodyColor: 0x4488ff },
      { key: 'player_red',    bodyColor: 0xff4444 },
      { key: 'player_green',  bodyColor: 0x44cc44 },
      { key: 'player_yellow', bodyColor: 0xffcc00 },
    ];

    configs.forEach(cfg => {
      const g = scene.add.graphics();
      const W = 32, H = 48;

      // --- body (rounded rect approximation) ---
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(4, 12, 24, 28);       // torso + legs area
      g.fillRect(6, 8,  20, 10);       // head base
      // rounded corners (small squares at corners to smooth)
      g.fillRect(7,  10, 18, 30);      // overlap for rounding

      // --- head ---
      g.fillStyle(0xffddaa, 1);        // skin tone
      g.fillRect(8, 4, 16, 16);        // head
      g.fillRect(7, 7, 18, 12);        // slightly wider cheeks

      // --- helmet / hair strip ---
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(7, 3, 18, 6);         // helmet top
      g.fillRect(6, 5, 20, 4);         // helmet brim

      // --- eyes (big, child-friendly) ---
      g.fillStyle(0xffffff, 1);
      g.fillRect(9,  8,  6, 7);        // left eye white
      g.fillRect(17, 8,  6, 7);        // right eye white

      g.fillStyle(0x222255, 1);
      g.fillRect(11, 9,  3, 4);        // left pupil
      g.fillRect(19, 9,  3, 4);        // right pupil

      // --- smile ---
      g.fillStyle(0xcc7755, 1);
      g.fillRect(10, 16, 12, 2);       // mouth line
      g.fillRect(9,  15, 2,  2);       // left corner up
      g.fillRect(21, 15, 2,  2);       // right corner up

      // --- arms ---
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(0,  16, 5,  12);      // left arm
      g.fillRect(27, 16, 5,  12);      // right arm

      // --- hands ---
      g.fillStyle(0xffddaa, 1);
      g.fillRect(0,  27, 5, 5);        // left hand
      g.fillRect(27, 27, 5, 5);        // right hand

      // --- legs ---
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(6,  38, 8, 10);       // left leg
      g.fillRect(18, 38, 8, 10);       // right leg

      // --- shoes ---
      g.fillStyle(0x334455, 1);
      g.fillRect(5,  44, 10, 4);       // left shoe
      g.fillRect(17, 44, 10, 4);       // right shoe

      g.generateTexture(cfg.key, W, H);
      g.destroy();
    });
  },

  // -----------------------------------------------------------
  // Enemy textures
  // -----------------------------------------------------------
  _createEnemies(scene) {
    // --- BasicEnemy (32x32): orange-red blob with grin and horns ---
    {
      const g = scene.add.graphics();
      const W = 32, H = 32;

      // body blob
      g.fillStyle(0xff6622, 1);
      g.fillRect(4, 8, 24, 20);
      g.fillRect(6, 6, 20, 22);
      g.fillRect(2, 12, 28, 14);

      // horns
      g.fillStyle(0xff2200, 1);
      g.fillRect(6,  2, 4, 8);         // left horn
      g.fillRect(22, 2, 4, 8);         // right horn
      g.fillRect(5,  1, 3, 4);         // left horn tip
      g.fillRect(24, 1, 3, 4);         // right horn tip

      // eyes (angry slant)
      g.fillStyle(0xffff00, 1);
      g.fillRect(7,  10, 7, 5);        // left eye
      g.fillRect(18, 10, 7, 5);        // right eye

      g.fillStyle(0x000000, 1);
      g.fillRect(9,  11, 4, 3);        // left pupil
      g.fillRect(20, 11, 4, 3);        // right pupil

      // angry eyebrows
      g.fillStyle(0xcc2200, 1);
      g.fillRect(6,  8, 9, 3);         // left brow (angled down-right)
      g.fillRect(8,  7, 5, 2);
      g.fillRect(17, 8, 9, 3);         // right brow
      g.fillRect(19, 7, 5, 2);

      // grin (wide toothy)
      g.fillStyle(0xffccaa, 1);
      g.fillRect(7, 21, 18, 5);        // mouth area

      g.fillStyle(0xffffff, 1);
      g.fillRect(8,  21, 4, 3);        // tooth 1
      g.fillRect(14, 21, 4, 3);        // tooth 2
      g.fillRect(20, 21, 4, 3);        // tooth 3

      g.fillStyle(0x000000, 1);
      g.fillRect(7, 20, 18, 1);        // mouth top line
      g.fillRect(7, 26, 18, 1);        // mouth bottom line

      // spots / texture
      g.fillStyle(0xff4400, 1);
      g.fillRect(14, 14, 3, 3);
      g.fillRect(20, 18, 3, 3);

      g.generateTexture('basic_enemy', W, H);
      g.destroy();
    }

    // --- StrongEnemy (40x40): purple-gray blob, larger, angry ---
    {
      const g = scene.add.graphics();
      const W = 40, H = 40;

      // body – hulking blob
      g.fillStyle(0x7755aa, 1);
      g.fillRect(4,  8, 32, 28);
      g.fillRect(6,  6, 28, 32);
      g.fillRect(2, 12, 36, 20);

      // dark shading on sides
      g.fillStyle(0x553388, 1);
      g.fillRect(2,  12, 5, 20);
      g.fillRect(33, 12, 5, 20);

      // thick angry eyebrows
      g.fillStyle(0x330066, 1);
      g.fillRect(6,  11, 12, 4);       // left brow
      g.fillRect(7,  9,  10, 3);
      g.fillRect(22, 11, 12, 4);       // right brow
      g.fillRect(23, 9,  10, 3);

      // eyes – red with dark pupils
      g.fillStyle(0xff2222, 1);
      g.fillRect(7,  14, 10, 8);       // left eye
      g.fillRect(23, 14, 10, 8);       // right eye

      g.fillStyle(0x000000, 1);
      g.fillRect(10, 15, 5, 6);        // left pupil
      g.fillRect(26, 15, 5, 6);        // right pupil

      // glowing pupils
      g.fillStyle(0xff8800, 1);
      g.fillRect(11, 16, 2, 3);
      g.fillRect(27, 16, 2, 3);

      // nose
      g.fillStyle(0x553388, 1);
      g.fillRect(17, 22, 6, 4);

      // mouth – frowning with teeth
      g.fillStyle(0x220033, 1);
      g.fillRect(8, 28, 24, 6);

      g.fillStyle(0xffffff, 1);
      g.fillRect(9,  28, 5, 3);
      g.fillRect(17, 28, 5, 3);
      g.fillRect(26, 28, 5, 3);

      // spikes on top
      g.fillStyle(0x553388, 1);
      g.fillRect(8,  2, 5, 8);
      g.fillRect(18, 0, 4, 8);
      g.fillRect(28, 2, 5, 8);

      g.generateTexture('strong_enemy', W, H);
      g.destroy();
    }

    // --- Boss (64x80): dark red wizard with hat, wand, number symbols ---
    {
      const g = scene.add.graphics();
      const W = 64, H = 80;

      // robe / body
      g.fillStyle(0x8b0000, 1);
      g.fillRect(12, 36, 40, 44);
      g.fillRect(10, 40, 44, 38);
      g.fillRect(8,  44, 48, 32);

      // robe details – dark lines
      g.fillStyle(0x660000, 1);
      g.fillRect(8,  44, 4, 32);
      g.fillRect(52, 44, 4, 32);
      g.fillRect(30, 40, 4, 40);

      // rune symbols on robe
      g.fillStyle(0xffaa00, 1);
      g.fillRect(14, 50, 2, 8);        // number "1" hint
      g.fillRect(18, 52, 6, 2);
      g.fillRect(18, 56, 6, 2);
      g.fillRect(18, 60, 6, 2);

      g.fillRect(38, 50, 6, 2);        // "x" symbol (multiply)
      g.fillRect(40, 52, 2, 4);
      g.fillRect(38, 56, 6, 2);

      // star / rune at center
      this._drawStar(g, 32, 65, 5, 2, 5, 0xffaa00, 1);

      // head
      g.fillStyle(0xffccaa, 1);
      g.fillRect(18, 22, 28, 22);
      g.fillRect(16, 24, 32, 18);

      // face features
      // eyes – glowing yellow
      g.fillStyle(0xffee00, 1);
      g.fillRect(20, 27, 8, 6);
      g.fillRect(36, 27, 8, 6);

      g.fillStyle(0x000000, 1);
      g.fillRect(22, 28, 4, 4);
      g.fillRect(38, 28, 4, 4);

      // menacing eyebrows
      g.fillStyle(0x330000, 1);
      g.fillRect(18, 24, 12, 3);
      g.fillRect(20, 23, 8,  2);
      g.fillRect(34, 24, 12, 3);
      g.fillRect(36, 23, 8,  2);

      // nose
      g.fillStyle(0xddaa88, 1);
      g.fillRect(29, 33, 6, 5);
      g.fillRect(27, 36, 10, 3);

      // sinister smile
      g.fillStyle(0x220000, 1);
      g.fillRect(20, 39, 24, 4);

      g.fillStyle(0xffffff, 1);
      g.fillRect(21, 39, 4, 2);
      g.fillRect(27, 39, 4, 2);
      g.fillRect(33, 39, 4, 2);
      g.fillRect(39, 39, 4, 2);

      // wizard hat (tall, dark purple)
      g.fillStyle(0x2d0066, 1);
      g.fillRect(10, 16, 44, 10);      // hat brim
      g.fillRect(18, 2,  28, 16);      // hat body
      g.fillRect(22, 0,  20, 4);       // hat top

      // hat band
      g.fillStyle(0xffaa00, 1);
      g.fillRect(12, 14, 40, 4);

      // hat star decoration
      this._drawStar(g, 32, 10, 5, 2, 5, 0xffee00, 1);

      // wand (right hand)
      g.fillStyle(0x4d1a00, 1);
      g.fillRect(56, 34, 4, 30);       // wand stick

      g.fillStyle(0xffaa00, 1);
      g.fillRect(54, 30, 8, 8);        // wand tip (glowing)
      g.fillRect(53, 31, 10, 6);

      // wand glow dots
      g.fillStyle(0xffffff, 1);
      g.fillRect(56, 32, 2, 2);

      // floating number symbols around boss
      g.fillStyle(0xffcc00, 0.9);
      // "×" left side
      g.fillRect(2, 20, 8, 2);
      g.fillRect(5, 18, 2, 6);
      // "=" right side  (use empty area)
      g.fillRect(56, 20, 6, 2);
      g.fillRect(56, 24, 6, 2);

      g.generateTexture('boss', W, H);
      g.destroy();
    }
  },

  // -----------------------------------------------------------
  // Bullet textures
  // -----------------------------------------------------------
  _createBullets(scene) {
    // Player bullet – bright yellow circle (8x8)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xffee00, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 1);
      g.generateTexture('bullet', 8, 8);
      g.destroy();
    }

    // Enemy bullet – red circle (8x8)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xff2222, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xff8888, 1);
      g.fillCircle(3, 3, 1);
      g.generateTexture('enemy_bullet', 8, 8);
      g.destroy();
    }

    // Boss bullet – dark red larger circle (10x10)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xcc0000, 1);
      g.fillCircle(5, 5, 5);
      g.fillStyle(0xff4444, 1);
      g.fillCircle(4, 4, 2);
      g.fillStyle(0xffaaaa, 1);
      g.fillCircle(3, 3, 1);
      g.generateTexture('boss_bullet', 10, 10);
      g.destroy();
    }
  },

  // -----------------------------------------------------------
  // Platform textures
  // -----------------------------------------------------------
  _createPlatforms(scene) {
    const widths = [32, 64, 96, 128, 192, 256, 384, 512];
    const H = 16;

    widths.forEach(W => {
      const g = scene.add.graphics();

      // Wood body – warm brown
      g.fillStyle(0x8b5e3c, 1);
      g.fillRect(0, 4, W, H - 4);

      // Wood grain lines
      g.fillStyle(0x7a5230, 1);
      for (let x = 0; x < W; x += 16) {
        g.fillRect(x, 6, 2, H - 6);
      }

      // Green grass top strip
      g.fillStyle(0x44aa22, 1);
      g.fillRect(0, 0, W, 5);

      // Lighter grass highlight
      g.fillStyle(0x66cc44, 1);
      g.fillRect(0, 0, W, 2);

      // Dark edge at bottom
      g.fillStyle(0x5a3d22, 1);
      g.fillRect(0, H - 2, W, 2);

      g.generateTexture(`platform_${W}`, W, H);
      g.destroy();
    });

    // Ground tile – full width (960x32)
    {
      const g = scene.add.graphics();
      const W = 960, H = 32;

      // Dirt / earth base
      g.fillStyle(0x8b5e3c, 1);
      g.fillRect(0, 6, W, H - 6);

      // Wood grain lines
      g.fillStyle(0x7a5230, 1);
      for (let x = 0; x < W; x += 32) {
        g.fillRect(x, 8, 3, H - 8);
      }

      // Green grass top strip
      g.fillStyle(0x44aa22, 1);
      g.fillRect(0, 0, W, 7);

      // Lighter grass highlight
      g.fillStyle(0x66cc44, 1);
      g.fillRect(0, 0, W, 3);

      // Dark edge at bottom
      g.fillStyle(0x5a3d22, 1);
      g.fillRect(0, H - 2, W, 2);

      g.generateTexture('ground', W, H);
      g.destroy();
    }
  },

  // -----------------------------------------------------------
  // Chest textures (40x40)
  // -----------------------------------------------------------
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

      // Chest body
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(2, 18, 36, 20);

      // Body border/shadow
      g.fillStyle(0x000000, 0.3);
      g.fillRect(2, 36, 36, 2);
      g.fillRect(36, 18, 2, 20);

      // Metal band across middle of body
      g.fillStyle(0xddaa00, 1);
      g.fillRect(2, 25, 36, 4);

      // Chest lid
      g.fillStyle(cfg.lidColor, 1);
      g.fillRect(2, 6, 36, 14);

      // Lid highlight
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(3, 7, 34, 4);

      // Lid border
      g.fillStyle(0xddaa00, 1);
      g.fillRect(2, 18, 36, 2);       // lid bottom border
      g.fillRect(2,  6, 36, 2);       // lid top border
      g.fillRect(2,  6, 2,  14);      // lid left border
      g.fillRect(36, 6, 2,  14);      // lid right border

      // Hinges
      g.fillStyle(0xbbaa00, 1);
      g.fillRect(5,  17, 6, 4);
      g.fillRect(29, 17, 6, 4);

      // Lock body
      g.fillStyle(cfg.lockColor, 1);
      g.fillRect(16, 20, 8, 7);

      // Lock shackle (arch)
      g.fillStyle(cfg.lockColor, 1);
      g.fillRect(17, 16, 2, 6);       // left post
      g.fillRect(21, 16, 2, 6);       // right post
      g.fillRect(17, 15, 6, 3);       // arch top

      // Lock keyhole
      g.fillStyle(0x000000, 1);
      g.fillRect(19, 22, 2, 4);
      g.fillCircle(20, 22, 2);

      // Open variant – show open lid
      if (cfg.key === 'chest_open') {
        // Draw lid tilted back (simple rectangle at top)
        g.fillStyle(cfg.lidColor, 1);
        g.fillRect(4, 2, 32, 8);
        // Inside darkness
        g.fillStyle(0x000000, 0.5);
        g.fillRect(4, 16, 32, 6);
        // Small glow inside
        g.fillStyle(0xffee88, 0.6);
        g.fillRect(8, 17, 24, 3);
      }

      g.generateTexture(cfg.key, W, H);
      g.destroy();
    });
  },

  // -----------------------------------------------------------
  // Weapon item pickups (24x24)
  // -----------------------------------------------------------
  _createWeaponItems(scene) {
    const items = [
      { key: 'weapon_item',    color: 0xaaaaaa, trim: 0xffffff },
      { key: 'weapon_item_t1', color: 0x44ff44, trim: 0xaaffaa },
      { key: 'weapon_item_t2', color: 0x4488ff, trim: 0xaaccff },
      { key: 'weapon_item_t3', color: 0xaa44ff, trim: 0xddaaff },
    ];

    items.forEach(cfg => {
      const g = scene.add.graphics();
      const W = 24, H = 24;

      // Gun body / handle
      g.fillStyle(0x444444, 1);
      g.fillRect(4, 12, 8, 8);         // grip / handle

      // Gun barrel
      g.fillStyle(cfg.color, 1);
      g.fillRect(4, 8,  16, 6);        // main body
      g.fillRect(18, 9,  4,  4);       // barrel extension

      // Slide top
      g.fillStyle(cfg.trim, 1);
      g.fillRect(5, 6, 14, 3);         // slide highlight

      // Trigger guard
      g.fillStyle(0x333333, 1);
      g.fillRect(8, 14, 5, 5);
      g.fillRect(9, 18, 3, 2);

      // Tier gem / indicator
      g.fillStyle(cfg.color, 1);
      g.fillRect(6, 9, 3, 3);

      // Muzzle flash hint
      g.fillStyle(0xffee88, 0.5);
      g.fillRect(20, 9, 3, 3);

      g.generateTexture(cfg.key, W, H);
      g.destroy();
    });
  },

  // -----------------------------------------------------------
  // Shield item pickup (24x24)
  // -----------------------------------------------------------
  _createShieldItem(scene) {
    const g = scene.add.graphics();
    const W = 24, H = 24;

    // Shield outer shape (kite shield)
    g.fillStyle(0xddaa00, 1);
    g.fillRect(4, 2, 16, 16);          // upper rectangle
    g.fillRect(6, 16, 12, 4);          // lower narrowing
    g.fillRect(8, 18, 8,  3);
    g.fillRect(10, 20, 4, 3);          // bottom point

    // Shield inner field
    g.fillStyle(0xffcc22, 1);
    g.fillRect(6, 4, 12, 12);
    g.fillRect(7, 14, 10, 3);
    g.fillRect(9, 16, 6,  2);

    // Shield boss (center ornament)
    g.fillStyle(0xddaa00, 1);
    g.fillRect(9, 8, 6, 6);
    g.fillStyle(0xffffff, 1);
    g.fillRect(11, 10, 2, 2);          // shine

    // Cross divider
    g.fillStyle(0xddaa00, 1);
    g.fillRect(11, 4, 2, 10);          // vertical
    g.fillRect(6,  9, 12, 2);          // horizontal

    g.generateTexture('shield_item', W, H);
    g.destroy();
  },

  // -----------------------------------------------------------
  // Checkpoint textures (16x48)
  // -----------------------------------------------------------
  _createCheckpoints(scene) {
    // Inactive checkpoint – gray flagpole with gray flag
    {
      const g = scene.add.graphics();
      const W = 16, H = 48;

      // Pole
      g.fillStyle(0x888888, 1);
      g.fillRect(7, 0, 3, 48);

      // Flag (gray, drooping)
      g.fillStyle(0x999999, 1);
      g.fillRect(10, 4,  12, 8);
      g.fillRect(10, 10, 10, 6);
      g.fillRect(10, 14, 7,  4);

      // Flag outline
      g.fillStyle(0x666666, 1);
      g.fillRect(10, 3, 12, 1);
      g.fillRect(10, 3, 1,  12);

      // Base weight
      g.fillStyle(0x666666, 1);
      g.fillRect(4, 44, 8, 4);

      g.generateTexture('checkpoint_inactive', W, H);
      g.destroy();
    }

    // Active checkpoint – gray pole with green waving flag
    {
      const g = scene.add.graphics();
      const W = 16, H = 48;

      // Pole
      g.fillStyle(0xaaaaaa, 1);
      g.fillRect(7, 0, 3, 48);

      // Flag (bright green)
      g.fillStyle(0x22cc44, 1);
      g.fillRect(10, 2,  12, 8);
      g.fillRect(10, 8,  14, 6);
      g.fillRect(10, 12, 11, 5);

      // Flag highlight
      g.fillStyle(0x55ee66, 1);
      g.fillRect(11, 3, 10, 3);

      // Flag outline
      g.fillStyle(0x008822, 1);
      g.fillRect(10, 2, 12, 1);
      g.fillRect(10, 2, 1,  14);

      // Star on flag
      this._drawStar(g, 16, 9, 3, 1, 5, 0xffee00, 1);

      // Base weight
      g.fillStyle(0x777777, 1);
      g.fillRect(4, 44, 8, 4);

      g.generateTexture('checkpoint_active', W, H);
      g.destroy();
    }
  },

  // -----------------------------------------------------------
  // HUD icons: hearts, clouds
  // -----------------------------------------------------------
  _createHUD(scene) {
    // heart_full (32x32) – solid red heart
    {
      const g = scene.add.graphics();
      this._drawHeart(g, 1, 5, 30, 0xee1111);
      // highlight
      g.fillStyle(0xff8888, 1);
      const s = Math.floor(30 / 8);
      g.fillRect(1 + s,       5,        s * 2, s);
      g.fillRect(1 + s * 4,   5,        s * 2, s);
      g.generateTexture('heart_full', 32, 32);
      g.destroy();
    }

    // heart_half (32x32) – left half red, right half gray
    {
      const g = scene.add.graphics();
      // Gray full heart first
      this._drawHeart(g, 1, 5, 30, 0x888888);
      // Red left half (clip by drawing over right side in gray first, then
      // drawing red only on left columns)
      g.fillStyle(0xee1111, 1);
      const s = Math.floor(30 / 8);
      // Left bump
      g.fillRect(1 + s,       5,        s * 2, s);
      // Left body rows
      g.fillRect(1,           5 + s,    s * 3 + 1, s);
      g.fillRect(1,           5 + s*2,  s * 3 + 1, s);
      g.fillRect(1,           5 + s*3,  s * 3 + 1, s);
      g.fillRect(1 + s,       5 + s*4,  s * 2 + 1, s);
      g.fillRect(1 + s * 2,   5 + s*5,  s + 1,     s);
      g.fillRect(1 + s * 3,   5 + s*6,  1,         s);
      g.generateTexture('heart_half', 32, 32);
      g.destroy();
    }

    // heart_empty (32x32) – gray outline heart
    {
      const g = scene.add.graphics();
      this._drawHeart(g, 1, 5, 30, 0x555555);
      // Inner cutout
      g.fillStyle(0x1a1a2e, 1);
      const s = Math.floor(30 / 8);
      g.fillRect(1 + s + 2,     5 + s + 2,     s * 5 - 4, s - 2);
      g.fillRect(1 + 2,         5 + s * 2 + 2, s * 7 - 4, s - 2);
      g.fillRect(1 + 2,         5 + s * 3 + 2, s * 7 - 4, s - 2);
      g.fillRect(1 + s + 2,     5 + s * 4 + 2, s * 5 - 4, s - 2);
      g.fillRect(1 + s * 2 + 2, 5 + s * 5 + 2, s * 3 - 4, s - 2);
      g.generateTexture('heart_empty', 32, 32);
      g.destroy();
    }

    // cloud (80x40) – white fluffy cloud
    {
      const g = scene.add.graphics();
      const W = 80, H = 40;

      g.fillStyle(0xeeeeff, 0.9);
      // Base rectangle
      g.fillRect(10, 20, 60, 18);
      // Left puff circle
      g.fillCircle(22, 22, 12);
      // Center puff circle (bigger)
      g.fillCircle(40, 16, 16);
      // Right puff circle
      g.fillCircle(58, 22, 12);

      // White highlight on top
      g.fillStyle(0xffffff, 1);
      g.fillCircle(40, 13, 10);
      g.fillCircle(25, 19, 7);
      g.fillCircle(55, 19, 7);

      g.generateTexture('cloud', W, H);
      g.destroy();
    }
  },

  // -----------------------------------------------------------
  // Background sky
  // -----------------------------------------------------------
  _createBackground(scene) {
    // bg_sky (960x540) – light blue gradient
    {
      const g = scene.add.graphics();
      const W = 960, H = 540;

      // Draw horizontal bands from top (dark blue) to bottom (light blue)
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t   = i / steps;
        const r   = Math.floor(Phaser.Math.Linear(0x22, 0x87, t));
        const gr  = Math.floor(Phaser.Math.Linear(0x33, 0xcc, t));
        const b   = Math.floor(Phaser.Math.Linear(0x66, 0xff, t));
        const hex = (r << 16) | (gr << 8) | b;
        g.fillStyle(hex, 1);
        const stripH = Math.ceil(H / steps);
        g.fillRect(0, i * stripH, W, stripH + 1);
      }

      // A few static clouds baked into the background
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(120, 80,  30);
      g.fillCircle(150, 70,  22);
      g.fillCircle(100, 85,  20);

      g.fillCircle(500, 120, 35);
      g.fillCircle(535, 110, 25);
      g.fillCircle(470, 125, 22);

      g.fillCircle(820, 60,  28);
      g.fillCircle(850, 52,  20);
      g.fillCircle(800, 65,  18);

      g.generateTexture('bg_sky', W, H);
      g.destroy();
    }
  },

  // -----------------------------------------------------------
  // UI elements: stars, lock icon
  // -----------------------------------------------------------
  _createUI(scene) {
    // star_gold (24x24) – filled gold 5-point star
    {
      const g = scene.add.graphics();
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, 24, 24);
      this._drawStar(g, 12, 12, 11, 4, 5, 0xffcc00, 1);
      // Highlight
      g.fillStyle(0xffee88, 0.7);
      g.fillRect(9, 5, 4, 4);
      g.generateTexture('star_gold', 24, 24);
      g.destroy();
    }

    // star_empty (24x24) – gray outlined star
    {
      const g = scene.add.graphics();
      // Draw outer star in gray
      this._drawStar(g, 12, 12, 11, 4, 5, 0x666666, 1);
      // Cut out inner area (smaller star in background color)
      this._drawStar(g, 12, 12, 8, 3, 5, 0x1a1a2e, 1);
      g.generateTexture('star_empty', 24, 24);
      g.destroy();
    }

    // lock_icon (24x24) – simple padlock, gray
    {
      const g = scene.add.graphics();
      const W = 24, H = 24;

      // Lock body
      g.fillStyle(0x888888, 1);
      g.fillRect(4, 11, 16, 12);
      // Body highlight
      g.fillStyle(0xaaaaaa, 1);
      g.fillRect(5, 12, 14, 4);

      // Shackle (arch) – outer
      g.fillStyle(0x888888, 1);
      g.fillRect(6,  4, 4, 10);        // left leg
      g.fillRect(14, 4, 4, 10);        // right leg
      g.fillRect(6,  2, 12, 4);        // top arch

      // Shackle inner cutout
      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(8,  4, 2, 9);
      g.fillRect(14, 4, 2, 9);
      g.fillRect(8,  2, 8, 4);

      // Keyhole
      g.fillStyle(0x333333, 1);
      g.fillCircle(12, 16, 3);
      g.fillRect(11, 17, 2, 4);

      g.generateTexture('lock_icon', W, H);
      g.destroy();
    }
  },

};
