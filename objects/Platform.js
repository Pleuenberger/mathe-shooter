// =============================================================
// objects/Platform.js - Mathe-Shooter
// Factory for static and moving platforms using Phaser arcade physics.
// Depends on: LEVELS (via levelConfig argument)
// =============================================================

window.PlatformFactory = {

  // -----------------------------------------------------------
  // Create the static platforms group from a level config.
  // Returns a Phaser.Physics.Arcade.StaticGroup.
  // levelConfig must have: worldWidth, platforms[]
  // Each entry in platforms: { x, y, width }
  //   x,y = top-left corner of the platform
  // -----------------------------------------------------------
  createGroup(scene, levelConfig) {
    const group = scene.physics.add.staticGroup();

    // Ground – full level width strip at the bottom of the world
    const groundY = scene.scale.height - 16; // center of the 32px ground tile
    const ground = group.create(
      levelConfig.worldWidth / 2,
      groundY,
      'ground'
    );
    ground.setDisplaySize(levelConfig.worldWidth, 32).refreshBody();

    // Individual platforms from level config
    if (Array.isArray(levelConfig.platforms)) {
      levelConfig.platforms.forEach(function (p) {
        // Pick the closest available texture width (see GraphicsFactory widths)
        const textureKey = 'platform_' + p.width;

        // x,y in config is the top-left corner; Phaser physics uses center
        const centerX = p.x + p.width / 2;
        const centerY = p.y + 8; // half of the 16px platform height

        const platform = group.create(centerX, centerY, textureKey);
        platform.setDisplaySize(p.width, 16).refreshBody();
        // Store source data for reference by other systems
        platform.platformData = { x: p.x, y: p.y, width: p.width };
      });
    }

    return group;
  },

  // -----------------------------------------------------------
  // Create moving platforms for levels that need them (e.g. level 5).
  // Returns a Phaser.Physics.Arcade.Group whose members have
  // tween-based horizontal oscillation already started.
  //
  // movingDefs (optional) – array of:
  //   { x, y, width, rangeX, duration }
  //   rangeX  – pixels to move left/right from start position
  //   duration – ms for one half-cycle (yoyo takes care of the other)
  // -----------------------------------------------------------
  createMovingPlatforms(scene, movingDefs) {
    const group = scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    });

    if (!Array.isArray(movingDefs) || movingDefs.length === 0) {
      return group;
    }

    movingDefs.forEach(function (def) {
      const textureKey = 'platform_' + (def.width || 96);
      const centerX    = def.x + (def.width || 96) / 2;
      const centerY    = def.y + 8;

      const platform = group.create(centerX, centerY, textureKey);
      platform.setDisplaySize(def.width || 96, 16);
      platform.body.allowGravity = false;
      platform.body.immovable    = true;

      // Oscillate horizontally using a tween
      scene.tweens.add({
        targets:  platform,
        x:        centerX + (def.rangeX || 120),
        duration: def.duration || 2000,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
        onUpdate: function () {
          // Keep the physics body in sync with the display object
          if (platform && platform.body) {
            platform.body.reset(platform.x, platform.y);
          }
        },
      });
    });

    return group;
  },
};
