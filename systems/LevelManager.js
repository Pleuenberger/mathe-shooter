// =============================================================
// systems/LevelManager.js - Mathe-Shooter
// Level configuration, progression, and star calculation.
// Depends on: ProfileSystem, CONSTANTS, window.LEVELS (from data/levels.js)
// =============================================================

// NOTE: window.LEVELS is defined in data/levels.js (loaded before this file).
// LevelManager provides access and progression logic only.

// =============================================================
// LevelManager
// =============================================================

window.LevelManager = {
  currentLevelId: 1,

  // ------------------------------------------------------------------
  // Level access
  // ------------------------------------------------------------------

  /**
   * Returns the config object for the given level id (1-10).
   * @param {number} id
   * @returns {Object|undefined}
   */
  getLevel(id) {
    return LEVELS[id - 1];
  },

  /**
   * Returns the config object for the currently active level.
   * @returns {Object}
   */
  getCurrent() {
    return this.getLevel(this.currentLevelId);
  },

  /**
   * Sets the active level id.
   * @param {number} id  1-10
   */
  setLevel(id) {
    this.currentLevelId = Math.max(1, Math.min(id, 10));
  },

  // ------------------------------------------------------------------
  // Unlock logic
  // ------------------------------------------------------------------

  /**
   * Returns true if the given level is unlocked for the profile.
   * Level 1 is always unlocked (needs 0 stars).
   * @param {number} levelId
   * @param {string} profileId
   * @returns {boolean}
   */
  isUnlocked(levelId, profileId) {
    const needed = CONSTANTS.STARS_TO_UNLOCK[levelId - 1];
    if (needed === undefined) return false;
    const total = ProfileSystem.getTotalStars(profileId);
    return total >= needed;
  },

  /**
   * Returns how many more stars the profile still needs to unlock a level.
   * Returns 0 if already unlocked.
   * @param {number} levelId
   * @param {string} profileId
   * @returns {number}
   */
  starsNeeded(levelId, profileId) {
    const needed = CONSTANTS.STARS_TO_UNLOCK[levelId - 1];
    if (needed === undefined) return 0;
    const total = ProfileSystem.getTotalStars(profileId);
    return Math.max(0, needed - total);
  },

  // ------------------------------------------------------------------
  // Progression
  // ------------------------------------------------------------------

  /**
   * Advance to the next level.
   * @returns {boolean} true if advanced, false if already at level 10.
   */
  nextLevel() {
    if (this.currentLevelId < 10) {
      this.currentLevelId++;
      return true;
    }
    return false; // level 10 complete → trigger credits
  },

  // ------------------------------------------------------------------
  // Star calculation
  // ------------------------------------------------------------------

  /**
   * Calculate how many stars (0-3) the player earned for a level run.
   *
   * Rules:
   *  0 stars – boss not defeated
   *  1 star  – boss defeated
   *  2 stars – boss defeated + at least 50% of chests answered correctly
   *  3 stars – 2 stars + took < 100 total damage in the second half of the level
   *
   * @param {boolean} bossDefeated
   * @param {number}  chestsCorrect   Number of chests answered correctly
   * @param {number}  totalChests     Total number of chests opened
   * @param {number}  damageInSecondHalf  HP lost in second half of level
   * @returns {number} 0-3
   */
  calculateStars(bossDefeated, chestsCorrect, totalChests, damageInSecondHalf) {
    if (!bossDefeated) return 0;

    let stars = 1; // boss defeated → at least 1 star

    const chestRatio = totalChests > 0 ? chestsCorrect / totalChests : 0;
    if (chestRatio >= 0.5) stars++;

    if (damageInSecondHalf < 100) stars++;

    return stars;
  },

  // ------------------------------------------------------------------
  // Convenience accessors
  // ------------------------------------------------------------------

  /**
   * Returns the active multiplication table rows for the current level.
   * Used by MathSystem.initForLevel and chest spawning logic.
   * @returns {number[]}
   */
  getActiveRows() {
    return this.getCurrent().activeRows;
  },
};
