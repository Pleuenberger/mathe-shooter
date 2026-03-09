// =============================================================
// scenes/GameScene.js - Mathe-Shooter
// Main gameplay scene.
// =============================================================

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId       = data.levelId || LevelManager.currentLevelId;
    LevelManager.setLevel(this.levelId);
    this._levelConfig  = LevelManager.getCurrent();
  }

  create() {
    // Reset stale per-run reference so getEnemyGroup() creates a fresh group
    // for this scene instance.  Without this, the second level run reuses the
    // destroyed group from the previous scene and crashes silently.
    this._enemyPhysicsGroup = null;

    // 1. Init systems for this level
    MathSystem.initForLevel(this._levelConfig);
    InventorySystem.init();

    // 2. World setup
    this.physics.world.setBounds(0, 0, this._levelConfig.worldWidth, 540);

    // 3. Background
    this._createBackground();

    // 4. Platforms
    this.platforms = PlatformFactory.createGroup(this, this._levelConfig);

    // 4b. Walls
    this.wallsGroup = this.physics.add.staticGroup();
    if (this._levelConfig.walls) {
      this._levelConfig.walls.forEach(w => {
        for (let i = 0; i < w.height; i++) {
          this.wallsGroup.create(w.x + 16, 524 - i * 32 - 16, 'wall_stone_tile');
        }
      });
    }

    // 5. Player
    const start = this._levelConfig.playerStart;
    this.player = new Player(this, start.x, start.y);

    // 6. Camera
    this.cameras.main.setBounds(0, 0, this._levelConfig.worldWidth, 540);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 7. Bullet pool
    BulletPool.create(this);

    // 8. Checkpoints
    this.checkpoints = [];
    this._levelConfig.checkpoints.forEach(cp => {
      this.checkpoints.push(new Checkpoint(this, cp.x, cp.y));
    });
    this._lastCheckpoint = { x: start.x, y: start.y };

    // 9. Math chests
    this.chests = [];
    this._levelConfig.chests.forEach(c => {
      this.chests.push(new MathChest(this, c.x, c.y, c.category));
    });

    // 10. Enemy spawn system
    // Build flat pool array from the enemyPool config
    const rawPool = this._levelConfig.enemyPool;
    if (Array.isArray(rawPool)) {
      this._enemyPool = [...rawPool];
    } else {
      this._enemyPool = [
        ...Array(rawPool.basic  || 0).fill('basic'),
        ...Array(rawPool.strong || 0).fill('strong'),
      ];
    }
    this._shuffleArray(this._enemyPool);

    this._activeEnemies   = [];
    this._boss            = null;
    this._bossActive      = false;
    this._spawnedFromPool = 0;
    this._killCount       = 0;
    this._totalPoolSize   = this._enemyPool.length;

    // Spawn initial enemies
    this._spawnNextEnemies();

    // 11. Items arrays
    this.weaponItems = [];
    this.shieldItems = [];

    // 12. Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys({
      a:  'A',
      d:  'D',
      w:  'W',
      s:  'S',
      e:  'E',
      x:  'X',
      q:  'Q',
      r:  'R',
      k1: Phaser.Input.Keyboard.KeyCodes.ONE,
      k2: Phaser.Input.Keyboard.KeyCodes.TWO,
      k3: Phaser.Input.Keyboard.KeyCodes.THREE,
      k4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      k5: Phaser.Input.Keyboard.KeyCodes.FIVE,
    });

    // 13. Physics colliders
    this._setupColliders();

    // 14. EventBus listeners
    this._setupEventListeners();

    // 15. HUD scene (parallel)
    this.scene.launch('HUDScene');

    // 16. Level stats tracking
    this._chestsTotal          = this.chests.length;
    this._chestsCorrect        = 0;
    this._damageInSecondHalf   = 0;
    this._inSecondHalf         = false;
    this._halfwayX             = this._levelConfig.worldWidth / 2;

    // 17. Tutorial
    if (this._levelConfig.tutorial) {
      this._setupTutorial();
    }

    // 18. Level intro text
    this._showLevelIntro();

    // 19. Math scene open state
    this._mathOpen     = false;
    this._pendingChest = null;
    this._shieldActive = false;
    this._shieldTimer  = null;

    // 20. Wind effect (level 8)
    this._windDrift = this._levelConfig.windDrift || 0;

    // Track second half damage
    EventBus.on('PLAYER_HP_CHANGED', this._trackSecondHalfDamage, this);
  }

  // ─────────────────────────────────────────────────────────────
  // _createBackground
  // ─────────────────────────────────────────────────────────────
  _createBackground() {
    const worldWidth = this._levelConfig.worldWidth;
    const theme = this._levelConfig.theme || 'meadow';
    const THEME_BG = {
      meadow:    'bg_meadow',
      forest:    'bg_forest',
      courtyard: 'bg_courtyard',
      garden:    'bg_garden',
      dungeon:   'bg_dungeon',
      tower:     'bg_tower',
      rooftop:   'bg_rooftop',
      wizard:    'bg_wizard',
      throne:    'bg_throne',
    };
    const bgKey = THEME_BG[theme] || 'bg_meadow';
    if (this.textures.exists(bgKey)) {
      this.add.tileSprite(worldWidth / 2, 270, worldWidth, 540, bgKey).setDepth(-10);
    } else {
      this.add.rectangle(
        worldWidth / 2, 270, worldWidth, 540,
        this._levelConfig.bgColor || 0x87CEEB
      ).setDepth(-10);
      for (let i = 0; i < 8; i++) {
        const cx = Phaser.Math.Between(100, worldWidth - 100);
        const cy = Phaser.Math.Between(50, 200);
        this.add.image(cx, cy, 'cloud').setAlpha(0.8).setDepth(-9);
      }
    }
    if (this._levelConfig.darkEffect) {
      this.add.rectangle(
        worldWidth / 2, 270, worldWidth, 540,
        0x000000, 0.4
      ).setDepth(-8);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _setupColliders
  // ─────────────────────────────────────────────────────────────
  _setupColliders() {
    // Player <-> platforms
    this.physics.add.collider(this.player, this.platforms);

    // Enemy group <-> platforms
    this.physics.add.collider(this.getEnemyGroup(), this.platforms);

    // Bullets <-> enemies
    this.physics.add.overlap(
      BulletPool.getGroup(), this.getEnemyGroup(),
      this._bulletHitEnemy, null, this
    );

    // Enemy/boss bullets <-> player (sprite first avoids Phaser group-vs-sprite bug)
    this.physics.add.overlap(
      this.player, BulletPool.getGroup(),
      this._bulletHitPlayer, null, this
    );

    // Player contact damage with enemies
    this.physics.add.overlap(
      this.player, this.getEnemyGroup(),
      this._playerTouchEnemy, null, this
    );

    // Player <-> checkpoints
    this.physics.add.overlap(
      this.player, this.checkpoints,
      this._activateCheckpoint, null, this
    );

    // Walls colliders
    if (this.wallsGroup) {
      this.physics.add.collider(this.player, this.wallsGroup);
      this.physics.add.collider(this.getEnemyGroup(), this.wallsGroup);
      this.physics.add.collider(
        BulletPool.getGroup(), this.wallsGroup,
        (bullet) => { bullet.destroy(); }, null, this
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // getEnemyGroup – lazy-creates the shared physics group
  // ─────────────────────────────────────────────────────────────
  getEnemyGroup() {
    if (!this._enemyPhysicsGroup) {
      this._enemyPhysicsGroup = this.physics.add.group();
    }
    return this._enemyPhysicsGroup;
  }

  // ─────────────────────────────────────────────────────────────
  // _setupEventListeners
  // ─────────────────────────────────────────────────────────────
  _setupEventListeners() {
    EventBus.on('MATH_RESULT',        this._onMathResult,      this);
    EventBus.on('BOSS_DEFEATED',      this._onBossDefeated,    this);
    EventBus.on('PLAYER_DIED',        this._onPlayerDied,      this);
    EventBus.on('BOSS_IMMUNE',        this._onBossImmune,      this);
    EventBus.on('BOSS_PHASE_CHANGED', this._onBossPhase,       this);
  }

  // ─────────────────────────────────────────────────────────────
  // _setupTutorial
  // ─────────────────────────────────────────────────────────────
  _setupTutorial() {
    this._tutorialHints = [];

    // "Move right" hint (visible from start)
    const moveHint = this.add.text(150, 420, '→ ' + STRINGS.TUTORIAL_MOVE, {
      fontSize: '15px',
      fill: '#ffff00',
      stroke: '#000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);
    this._tutorialHints.push({ obj: moveHint, type: 'move', shown: true, triggerX: 150 });

    // "Jump" hint
    const jumpHint = this.add.text(300, 460, '↑ ' + STRINGS.TUTORIAL_JUMP, {
      fontSize: '13px',
      fill: '#ffff00',
      stroke: '#000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100).setVisible(false);
    this._tutorialHints.push({ obj: jumpHint, type: 'jump', shown: false, triggerX: 300 });

    // "Shoot" hint
    const shootHint = this.add.text(480, 460, 'X → ' + STRINGS.TUTORIAL_SHOOT, {
      fontSize: '13px',
      fill: '#ffff00',
      stroke: '#000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100).setVisible(false);
    this._tutorialHints.push({ obj: shootHint, type: 'shoot', shown: false, triggerX: 450 });

    // "Open chest" hint
    const chestHint = this.add.text(480, 440, 'E → ' + STRINGS.TUTORIAL_CHEST, {
      fontSize: '13px',
      fill: '#ffff00',
      stroke: '#000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100).setVisible(false);
    this._tutorialHints.push({ obj: chestHint, type: 'chest', shown: false, triggerX: 550 });
  }

  // ─────────────────────────────────────────────────────────────
  // _showLevelIntro
  // ─────────────────────────────────────────────────────────────
  _showLevelIntro() {
    const introText = STRINGS.LEVEL_INTRO[this.levelId - 1] || '';
    if (!introText) return;

    const text = this.add.text(480, 270, introText, {
      fontSize: '20px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: '#000000aa',
      padding: { x: 16, y: 10 },
      wordWrap: { width: 700 },
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: text,
        alpha: 0,
        duration: 500,
        onComplete: () => text.destroy(),
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // _spawnNextEnemies
  // ─────────────────────────────────────────────────────────────
  _spawnNextEnemies() {
    while (
      this._activeEnemies.filter(e => e.isAlive).length < CONSTANTS.MAX_ACTIVE_ENEMIES
    ) {
      if (this._spawnedFromPool >= this._totalPoolSize) break;

      const type    = this._enemyPool[this._spawnedFromPool++];
      const spawnPt = this._levelConfig.spawnPoints[
        Phaser.Math.Between(0, this._levelConfig.spawnPoints.length - 1)
      ];

      let enemy;
      if (type === 'strong') {
        enemy = new StrongEnemy(this, spawnPt.x, spawnPt.y - 30);
      } else {
        enemy = new BasicEnemy(this, spawnPt.x, spawnPt.y - 30);
      }

      this.physics.add.collider(enemy, this.platforms);
      this.getEnemyGroup().add(enemy);
      this._activeEnemies.push(enemy);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _spawnBoss
  // ─────────────────────────────────────────────────────────────
  _spawnBoss() {
    const bp = this._levelConfig.bossPosition;
    this._boss = new Boss(this, bp.x, bp.y - 40, this.levelId);
    this.physics.add.collider(this._boss, this.platforms);
    this._bossActive = true;

    // Extra colliders for boss (sprite first avoids Phaser group-vs-sprite bug)
    this.physics.add.overlap(
      this._boss, BulletPool.getGroup(),
      this._bulletHitBoss, null, this
    );
    this.physics.add.overlap(
      this.player, this._boss,
      this._playerTouchBoss, null, this
    );

    // Spawn hard math chests that reward shields near the boss area.
    // Players must solve a 6er–9er problem (category 'hard') to earn the shield.
    const shieldChestY = Math.min(bp.y - 10, 400);

    const chestWood      = new MathChest(this, bp.x - 600, shieldChestY, 'hard');
    chestWood.rewardType = 'shield';
    chestWood.shieldTier = 1; // wood shield: 50% protection
    this.chests.push(chestWood);

    if (this.levelId >= 5) {
      const chestSteel      = new MathChest(this, bp.x - 350, shieldChestY, 'hard');
      chestSteel.rewardType = 'shield';
      chestSteel.shieldTier = 2; // steel shield: 75% protection
      this.chests.push(chestSteel);
    }

    // Update star-calculation total to include the shield chests
    this._chestsTotal = this.chests.length;

    // Boss announcement banner
    const bossText = this.add.text(480, 200, '⚠ BOSS ⚠', {
      fontSize: '40px',
      fill: '#ff0000',
      stroke: '#ffff00',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: bossText,
      alpha: 0,
      duration: 2000,
      delay: 1500,
      onComplete: () => bossText.destroy(),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Collision callbacks
  // ─────────────────────────────────────────────────────────────
  _bulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.isAlive || bullet.isEnemyBullet) return;

    AudioSystem.enemyHit();

    if (typeof enemy.takeDamage === 'function') {
      enemy.takeDamage(bullet.damage, bullet.weaponData);
    }

    // Splash damage for rocket
    if (bullet.weaponData && bullet.weaponData.splashRadius) {
      const splash = bullet.weaponData.splashRadius;
      this._activeEnemies.forEach(e => {
        if (e !== enemy && e.isAlive) {
          const dx = e.x - bullet.x;
          const dy = e.y - bullet.y;
          if (Math.sqrt(dx * dx + dy * dy) < splash) {
            e.takeDamage(Math.floor(bullet.damage * 0.5), null);
          }
        }
      });
    }

    // Piercing weapons stay active
    if (!bullet.weaponData || !bullet.weaponData.piercing) {
      bullet.deactivate();
    }
  }

  _bulletHitBoss(boss, bullet) {
    if (!bullet.active || !boss.isAlive || bullet.isEnemyBullet) return;

    AudioSystem.enemyHit();

    if (typeof boss.takeDamage === 'function') {
      boss.takeDamage(bullet.weaponData);
    }

    if (!bullet.weaponData || !bullet.weaponData.piercing) {
      bullet.deactivate();
    }
  }

  _bulletHitPlayer(player, bullet) {
    if (!bullet.active || !bullet.isEnemyBullet) return;
    if (this._shieldActive) { bullet.deactivate(); return; }
    bullet.deactivate();
    player.takeDamage(bullet.damage || CONSTANTS.DAMAGE_STRONG_PROJECTILE);
  }

  _playerTouchEnemy(player, enemy) {
    if (!enemy.isAlive || player._invincible) return;
    if (this._shieldActive) return;
    player.takeDamage(CONSTANTS.DAMAGE_BASIC_ENEMY);
    player._invincible = true;
    this.time.delayedCall(1000, () => {
      if (player.active) player._invincible = false;
    });
  }

  _playerTouchBoss(player, boss) {
    if (!boss.isAlive || player._invincible) return;
    if (this._shieldActive) return;
    const dmg = (boss.phase === 3)
      ? CONSTANTS.DAMAGE_BOSS_CONTACT
      : CONSTANTS.DAMAGE_BOSS_PROJECTILE;
    player.takeDamage(dmg);
    player._invincible = true;
    this.time.delayedCall(1500, () => {
      if (player.active) player._invincible = false;
    });
  }

  _activateCheckpoint(player, checkpoint) {
    if (checkpoint.activated) return;
    checkpoint.activate();
    this._lastCheckpoint = { x: checkpoint.x, y: checkpoint.y - 50 };

    // Floating confirmation text
    const flash = this.add.text(checkpoint.x, checkpoint.y - 70, '✓ Checkpoint!', {
      fontSize: '14px',
      fill: '#00ff00',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: flash,
      y: flash.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => flash.destroy(),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // EventBus handlers
  // ─────────────────────────────────────────────────────────────
  _activateShieldManual() {
    if (this._mathOpen) return;
    if (this._shieldActive) return;
    if (!InventorySystem.shieldSlot) return;
    const shield = InventorySystem.useShield();
    if (!shield) return;
    this._shieldActive = true;
    if (this.player && this.player.active) this.player.setTint(0x4488ff);
    if (this._shieldTimer) this._shieldTimer.remove(false);
    this._shieldTimer = this.time.delayedCall(5000, () => this._deactivateShield());
  }

  _deactivateShield() {
    this._shieldActive = false;
    if (this.player && this.player.active) this.player.clearTint();
    if (this._shieldTimer) { this._shieldTimer.remove(false); this._shieldTimer = null; }
  }

  _onMathResult(data) {
    this._mathOpen = false;

    if (data.correct) {
      this._chestsCorrect++;

      // HP regen based on answer speed
      if (data.timeMs < 2000) {
        this.player.heal(CONSTANTS.HP_REGEN_FAST);
      } else if (data.timeMs < 3000) {
        this.player.heal(CONSTANTS.HP_REGEN_MED);
      } else if (data.timeMs < 4000) {
        this.player.heal(CONSTANTS.HP_REGEN_SLOW);
      }

      // Spawn reward from the chest
      if (this._pendingChest) {
        if (this._pendingChest.rewardType === 'shield') {
          const tier2     = this._pendingChest.shieldTier >= 2;
          const shieldCfg = {
            id:         tier2 ? 'steel_shield' : 'wood_shield',
            name:       tier2 ? 'Stahlschild'  : 'Holzschild',
            protection: tier2 ? 0.75 : 0.5,
          };
          const shield = new ShieldItem(
            this,
            this._pendingChest.x,
            this._pendingChest.y - 60,
            shieldCfg
          );
          this.shieldItems.push(shield);
        } else {
          const category  = this._pendingChest.category;
          const tier      = category === 'easy' ? 1 : category === 'medium' ? 2 : 3;
          const pool      = WEAPON_POOLS[tier];
          const weaponId  = pool[Phaser.Math.Between(0, pool.length - 1)];
          const weaponData = { ...WEAPONS[weaponId] };

          const item = new WeaponItem(
            this,
            this._pendingChest.x,
            this._pendingChest.y - 60,
            weaponData
          );
          this.weaponItems.push(item);
          EventBus.emit('WEAPON_UNLOCKED', weaponData);
        }
      }
    }

    this._pendingChest = null;
  }

  _onBossDefeated() {
    this._bossActive = false;

    // Note: AudioSystem.bossDie() is already called inside Boss._die()

    const stars = LevelManager.calculateStars(
      true,
      this._chestsCorrect,
      this._chestsTotal,
      this._damageInSecondHalf
    );

    // Save progress
    const profile = ProfileSystem.getActive();
    if (profile) {
      ProfileSystem.saveLevelStars(profile.id, this.levelId, stars);

      const nextLevel = Math.min(10, this.levelId + 1);
      ProfileSystem.setCurrentLevel(profile.id, nextLevel);
    }

    // Extra life for 3 stars
    const extraLife = stars === 3;
    if (extraLife) {
      const prof2 = ProfileSystem.getActive();
      if (prof2) {
        const lives = ProfileSystem.getLives(prof2.id);
        ProfileSystem.setLives(
          prof2.id,
          Math.min(CONSTANTS.PLAYER_MAX_LIVES, lives + 1)
        );
      }
    }

    InventorySystem.prepareForNextLevel();
    EventBus.emit('LEVEL_COMPLETE', { stars, extraLife });
    AudioSystem.levelComplete();

    this.time.delayedCall(1500, () => {
      this.scene.stop('HUDScene');
      this.scene.stop('MathScene');

      if (this.levelId === 10) {
        this.scene.start('CreditsScene');
      } else {
        this.scene.start('LevelCompleteScene', {
          stars,
          extraLife,
          levelId: this.levelId,
        });
      }
    });
  }

  _onPlayerDied() {
    const profile = ProfileSystem.getActive();
    if (!profile) return;

    let lives = ProfileSystem.getLives(profile.id);
    lives--;
    ProfileSystem.setLives(profile.id, lives);

    if (lives <= 0) {
      // Game over – reset to level 1
      ProfileSystem.setLives(profile.id, CONSTANTS.PLAYER_START_LIVES);
      ProfileSystem.setCurrentLevel(profile.id, 1);

      this.time.delayedCall(2000, () => {
        this.scene.stop('HUDScene');
        this.scene.stop('MathScene');
        this.scene.start('GameOverScene');
      });
    } else {
      // Respawn at last checkpoint
      this.time.delayedCall(1500, () => {
        if (this.player && this.player.active) {
          this.player.respawn(this._lastCheckpoint.x, this._lastCheckpoint.y);
        }
      });
    }
  }

  _onBossImmune() {
    const banner = this.add.text(480, 150, STRINGS.BOSS_IMMUNE, {
      fontSize: '20px',
      fill: '#ff4444',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 500,
      delay: 2000,
      onComplete: () => banner.destroy(),
    });
  }

  _onBossPhase(data) {
    const banner = this.add.text(480, 200, data.msg, {
      fontSize: '22px',
      fill: '#ff8800',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 600,
      delay: 2500,
      onComplete: () => banner.destroy(),
    });
  }

  _trackSecondHalfDamage(hp, maxHp) {
    if (this._inSecondHalf && this._lastHp !== undefined) {
      const lost = this._lastHp - hp;
      if (lost > 0) {
        this._damageInSecondHalf += lost;
      }
    }
    this._lastHp = hp;
  }

  // ─────────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.player || !this.player.active) return;

    this.player.update(time, delta, this.cursors, this.keys, this.platforms);

    // Track second half entry
    if (this.player.x > this._halfwayX) this._inSecondHalf = true;

    // Pit detection
    if (this.player.y > 560) {
      this.player.takeDamage(CONSTANTS.DAMAGE_PIT);
      this.player.respawn(this._lastCheckpoint.x, this._lastCheckpoint.y);
    }

    // Wind effect (level 8) – apply gentle horizontal push in air
    if (this._windDrift && this.player.body && !this.player.body.touching.down) {
      this.player.body.velocity.x += this._windDrift * (delta / 1000);
    }

    // Update enemies
    const aliveEnemies = this._activeEnemies.filter(e => e.active && e.isAlive);
    aliveEnemies.forEach(enemy => {
      if (enemy instanceof StrongEnemy) {
        enemy.update(
          time, delta, this.platforms, this._levelConfig.worldWidth,
          this.player.x, this.player.y, BulletPool
        );
      } else {
        enemy.update(
          time, delta, this.platforms, this._levelConfig.worldWidth, this.player.x
        );
      }
    });

    // Clean up destroyed enemies
    this._activeEnemies = this._activeEnemies.filter(e => e.active);
    const aliveCount    = this._activeEnemies.filter(e => e.isAlive).length;

    if (!this._bossActive) {
      if (aliveCount < CONSTANTS.MAX_ACTIVE_ENEMIES && this._spawnedFromPool < this._totalPoolSize) {
        this._spawnNextEnemies();
      }
      // All pool enemies gone AND boss not yet spawned
      if (this._spawnedFromPool >= this._totalPoolSize && aliveCount === 0 && !this._boss) {
        this._spawnBoss();
      }
    }

    // Update boss
    if (this._boss && this._boss.active) {
      this._boss.update(time, delta, this.player.x, this.player.y, BulletPool);
    }

    // Proximity checks for chests + items
    this._checkProximity();

    // E key → interact
    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this._handleInteract();
    }

    // Number keys → weapon slots
    if (Phaser.Input.Keyboard.JustDown(this.keys.k1)) InventorySystem.switchTo(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.k2)) InventorySystem.switchTo(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.k3)) InventorySystem.switchTo(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.k4)) InventorySystem.switchTo(3);
    if (Phaser.Input.Keyboard.JustDown(this.keys.k5)) this._activateShieldManual();

    // Tutorial update
    if (this._levelConfig.tutorial) this._updateTutorial();
  }

  // ─────────────────────────────────────────────────────────────
  // _checkProximity
  // ─────────────────────────────────────────────────────────────
  _checkProximity() {
    const INTERACT_DIST = 80;
    const px = this.player.x;
    const py = this.player.y;

    // Chests
    this.chests.forEach(chest => {
      if (chest.active) {
        const d = Phaser.Math.Distance.Between(px, py, chest.x, chest.y);
        chest.setNearPlayer(d < INTERACT_DIST);
      }
    });

    // Weapon items
    this.weaponItems = this.weaponItems.filter(item => item.active);
    this.weaponItems.forEach(item => {
      if (item.active) {
        const d = Phaser.Math.Distance.Between(px, py, item.x, item.y);
        item.showHint(d < INTERACT_DIST);
      }
    });

    // Shield items
    this.shieldItems = this.shieldItems.filter(item => item.active);
    this.shieldItems.forEach(item => {
      if (item.active && typeof item.showHint === 'function') {
        const d = Phaser.Math.Distance.Between(px, py, item.x, item.y);
        item.showHint(d < INTERACT_DIST);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // _handleInteract
  // ─────────────────────────────────────────────────────────────
  _handleInteract() {
    const INTERACT_DIST = 80;
    const px = this.player.x;
    const py = this.player.y;

    // Chests first
    for (const chest of this.chests) {
      if (!chest.active || chest.opened) continue;
      const d = Phaser.Math.Distance.Between(px, py, chest.x, chest.y);
      if (d < INTERACT_DIST) {
        chest.open();
        this._openMathChest(chest);
        return;
      }
    }

    // Weapon items
    for (let i = this.weaponItems.length - 1; i >= 0; i--) {
      const item = this.weaponItems[i];
      if (!item.active) continue;
      const d = Phaser.Math.Distance.Between(px, py, item.x, item.y);
      if (d < INTERACT_DIST) {
        const dropped = InventorySystem.pickUpWeapon(item.weaponData);
        if (dropped) {
          const droppedItem = new WeaponItem(
            this, this.player.x, this.player.y - 10, dropped
          );
          this.weaponItems.push(droppedItem);
        }
        item.collect();
        AudioSystem.pickup();
        EventBus.emit('INVENTORY_CHANGED', InventorySystem.slots);
        return;
      }
    }

    // Shield items
    for (let i = this.shieldItems.length - 1; i >= 0; i--) {
      const item = this.shieldItems[i];
      if (!item.active) continue;
      const d = Phaser.Math.Distance.Between(px, py, item.x, item.y);
      if (d < INTERACT_DIST) {
        InventorySystem.pickUpShield(item.shieldData);
        item.collect();
        AudioSystem.pickup();
        return;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _openMathChest
  // ─────────────────────────────────────────────────────────────
  _openMathChest(chest) {
    if (this._mathOpen) return;
    this._mathOpen     = true;
    this._pendingChest = chest;

    AudioSystem.chestOpen();

    let problem;
    if (chest.rewardType === 'shield') {
      // Shield chests always use rows 6-9, multipliers 2-9 (no ×1 or ×10)
      const shieldRows = [6, 7, 8, 9];
      const row = shieldRows[Math.floor(Math.random() * shieldRows.length)];
      const m   = Math.floor(Math.random() * 8) + 2; // 2–9
      problem = { a: row, b: m, answer: row * m, tableRow: row, category: 'hard' };
    } else {
      problem = MathSystem.generateProblem(chest.category);
    }

    this.scene.launch('MathScene', { problem });
  }

  // ─────────────────────────────────────────────────────────────
  // _updateTutorial
  // ─────────────────────────────────────────────────────────────
  _updateTutorial() {
    if (!this._tutorialHints) return;

    this._tutorialHints.forEach(hint => {
      if (hint.type === 'move' && hint.shown && this.player.x > 150) {
        hint.obj.destroy();
        hint.shown = false;
      }
      if (hint.type === 'jump' && !hint.shown && this.player.x > hint.triggerX) {
        hint.obj.setVisible(true);
        hint.shown = true;
      }
      if (hint.type === 'shoot' && !hint.shown && this.player.x > hint.triggerX) {
        hint.obj.setVisible(true);
        hint.shown = true;
      }
      if (hint.type === 'chest' && !hint.shown && this.player.x > hint.triggerX) {
        hint.obj.setVisible(true);
        hint.shown = true;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // _shuffleArray – Fisher-Yates
  // ─────────────────────────────────────────────────────────────
  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i]    = arr[j];
      arr[j]    = tmp;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // shutdown – clean up EventBus listeners
  // ─────────────────────────────────────────────────────────────
  shutdown() {
    EventBus.off('MATH_RESULT',        this._onMathResult,           this);
    EventBus.off('BOSS_DEFEATED',      this._onBossDefeated,         this);
    EventBus.off('PLAYER_DIED',        this._onPlayerDied,           this);
    EventBus.off('BOSS_IMMUNE',        this._onBossImmune,           this);
    EventBus.off('BOSS_PHASE_CHANGED', this._onBossPhase,            this);
    EventBus.off('PLAYER_HP_CHANGED',  this._trackSecondHalfDamage,  this);
    if (this._shieldTimer) { this._shieldTimer.remove(false); this._shieldTimer = null; }
  }
}
