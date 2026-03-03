// =============================================================
// utils/Constants.js - Mathe-Shooter
// Central constants for the entire game
// =============================================================

window.CONSTANTS = {
  // ----------------------------------------------------------
  // Game dimensions
  // ----------------------------------------------------------
  GAME_WIDTH:  960,
  GAME_HEIGHT: 540,
  TILE_SIZE:   32,

  // ----------------------------------------------------------
  // Player
  // ----------------------------------------------------------
  PLAYER_SPEED:       200,
  PLAYER_JUMP_VELOCITY: -500,
  PLAYER_MAX_HP:      300,
  PLAYER_START_LIVES: 3,
  PLAYER_MAX_LIVES:   9,

  // ----------------------------------------------------------
  // Damage values
  // ----------------------------------------------------------
  DAMAGE_PIT:              25,
  DAMAGE_BASIC_ENEMY:      20,
  DAMAGE_STRONG_PROJECTILE: 25,
  DAMAGE_BOSS_PROJECTILE:  35,
  DAMAGE_BOSS_CONTACT:     40,

  // ----------------------------------------------------------
  // HP regeneration from fast math answers
  // ----------------------------------------------------------
  HP_REGEN_FAST: 20,  // answered in < 2 seconds
  HP_REGEN_MED:  10,  // answered in 2–3 seconds
  HP_REGEN_SLOW:  5,  // answered in 3–4 seconds

  // ----------------------------------------------------------
  // Math challenge
  // ----------------------------------------------------------
  MATH_TIME_LIMIT: 5000, // ms – total time for one question

  // ----------------------------------------------------------
  // Weapon tiers
  // ----------------------------------------------------------
  TIER_COMMON:   1,
  TIER_UNCOMMON: 2,
  TIER_RARE:     3,

  // Tier display colors (hex number, suitable for Phaser tint)
  TIER_COLORS: {
    1: 0x44ff44,
    2: 0x4488ff,
    3: 0xaa44ff
  },

  // Tier display names
  TIER_NAMES: {
    1: 'Common',
    2: 'Uncommon',
    3: 'Rare'
  },

  // ----------------------------------------------------------
  // Level unlocking
  // STARS_TO_UNLOCK[i] = cumulative stars needed to unlock level i
  // Level 0 (index 0) is always unlocked (needs 0 stars)
  // ----------------------------------------------------------
  STARS_TO_UNLOCK: [0, 1, 3, 6, 9, 12, 14, 16, 17, 18],

  // ----------------------------------------------------------
  // Level 10 boss mastery requirement
  // Player must have answered >= 70% of math questions correctly
  // across all previous levels to damage the final boss
  // ----------------------------------------------------------
  MASTERY_THRESHOLD: 0.70,

  // ----------------------------------------------------------
  // Weapon item world pickup
  // ----------------------------------------------------------
  WEAPON_DESPAWN_MS: 30000, // 30 seconds until weapon item disappears

  // ----------------------------------------------------------
  // Enemy spawning cap
  // ----------------------------------------------------------
  MAX_ACTIVE_ENEMIES: 2,

  // ----------------------------------------------------------
  // Math difficulty categories
  // ----------------------------------------------------------
  CATEGORY_EASY:   'easy',
  CATEGORY_MEDIUM: 'medium',
  CATEGORY_HARD:   'hard',

  // Which multiplication table rows belong to each category
  CATEGORY_ROWS: {
    easy:   [1, 2, 5, 10],
    medium: [3, 4],
    hard:   [6, 7, 8, 9]
  },

  // ----------------------------------------------------------
  // Meister / performance score thresholds
  // (ratio of correct answers out of total attempts)
  // ----------------------------------------------------------
  SCORE_MASTER:    0.90, // >= 90%  → Mathe-Meister
  SCORE_VERY_GOOD: 0.70, // >= 70%  → Sehr gut
  SCORE_GOOD:      0.40, // >= 40%  → Gut
  // below 40% → Weiter üben
};
