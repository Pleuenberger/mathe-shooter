// =============================================================
// game.js - Mathe-Shooter
// Phaser 3 configuration and global EventBus
// =============================================================

// Global EventBus for cross-scene communication
// Initialized after Phaser loads (see bottom of file)
window.EventBus = null;

// -------------------------------------------------------------
// EventBus event name constants
// -------------------------------------------------------------
window.EVENTS = {
  PLAYER_HP_CHANGED:    'PLAYER_HP_CHANGED',    // (hp, maxHp)
  WEAPON_EQUIPPED:      'WEAPON_EQUIPPED',       // (slot, weapon)
  WEAPON_UNLOCKED:      'WEAPON_UNLOCKED',       // (weapon)
  ENEMY_KILLED:         'ENEMY_KILLED',          // (points)
  MATH_RESULT:          'MATH_RESULT',           // { correct, tableRow, timeMs }
  BOSS_IMMUNE:          'BOSS_IMMUNE',           // ()
  BOSS_DEFEATED:        'BOSS_DEFEATED',         // ()
  LEVEL_COMPLETE:       'LEVEL_COMPLETE',        // { stars }
  PLAYER_DIED:          'PLAYER_DIED',           // ()
  RELOAD_START:         'RELOAD_START',          // { slot, duration }
  RELOAD_COMPLETE:      'RELOAD_COMPLETE',       // { slot }
  SHIELD_ACTIVATED:     'SHIELD_ACTIVATED',      // ()
  INVENTORY_CHANGED:    'INVENTORY_CHANGED',     // (slots array)
  CHEST_OPENED:         'CHEST_OPENED',          // { category, correct }
};

// -------------------------------------------------------------
// Phaser 3 game configuration
// -------------------------------------------------------------
const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  parent: document.body,
  // Disable Phaser's built-in audio — we use our own Web Audio API via AudioSystem
  audio: {
    noAudio: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: [
    BootScene,
    ProfileScene,
    MenuScene,
    GameScene,
    HUDScene,
    MathScene,
    LevelCompleteScene,
    CreditsScene,
    GameOverScene
  ]
};

// Create the Phaser game instance
const game = new Phaser.Game(config);

// Initialize global EventBus after Phaser is loaded
window.EventBus = new Phaser.Events.EventEmitter();

// Lazy-init our AudioSystem on the first user gesture (browser autoplay policy).
// Using { once: true } so it only fires once.
document.addEventListener('pointerdown', function unlockAudio() {
  AudioSystem.init();
}, { once: true });
document.addEventListener('keydown', function unlockAudio() {
  AudioSystem.init();
}, { once: true });
