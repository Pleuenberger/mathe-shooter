// =============================================================
// systems/MathSystem.js - Mathe-Shooter
// Generates multiplication problems and tracks answer statistics.
// Depends on: ProfileSystem, CONSTANTS
// =============================================================

window.MathSystem = {
  // Pools per category – arrays of { a, b, answer, tableRow, category }
  _pools: { easy: [], medium: [], hard: [] },
  _used:  { easy: new Set(), medium: new Set(), hard: new Set() },

  // Rows that are active in the current level (set via initForLevel)
  _activeRows: [1, 2],

  // ------------------------------------------------------------------
  // Initialisation
  // ------------------------------------------------------------------

  /**
   * Set up pools for the given level config.
   * Call once before the level starts.
   * @param {{ activeRows: number[] }} levelConfig
   */
  initForLevel(levelConfig) {
    this._activeRows = levelConfig.activeRows || [1, 2];
    this._rebuildPools();
  },

  // ------------------------------------------------------------------
  // Pool management
  // ------------------------------------------------------------------

  /**
   * Re-builds all three category pools from the currently active rows.
   * Each entry is a unique "row × multiplier" pair (multiplier 1-10).
   */
  _rebuildPools() {
    const categories = [
      CONSTANTS.CATEGORY_EASY,
      CONSTANTS.CATEGORY_MEDIUM,
      CONSTANTS.CATEGORY_HARD,
    ];

    categories.forEach(cat => {
      // Collect only active rows that belong to this category
      const catRows = CONSTANTS.CATEGORY_ROWS[cat];
      const rows = this._activeRows.filter(r => catRows.includes(r));

      const problems = [];
      rows.forEach(row => {
        for (let m = 1; m <= 10; m++) {
          const key = `${row}x${m}`;
          problems.push({
            key,
            a:        row,
            b:        m,
            answer:   row * m,
            tableRow: row,
            category: cat,
          });
        }
      });

      // Shuffle in place (Fisher-Yates)
      for (let i = problems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [problems[i], problems[j]] = [problems[j], problems[i]];
      }

      this._pools[cat] = problems;
      this._used[cat].clear();
    });
  },

  /**
   * Resets the pool for a single category (called when every problem
   * in that category has been used once).
   * @param {string} category
   */
  _resetPool(category) {
    // Shuffle the existing entries and clear used set
    const pool = this._pools[category];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this._used[category].clear();
  },

  // ------------------------------------------------------------------
  // Problem generation
  // ------------------------------------------------------------------

  /**
   * Generate the next problem for the given category.
   * If all problems in the pool have been used, the pool is recycled.
   * Falls back to a random problem if the pool for this category is empty
   * (e.g. no active rows belong to the category yet).
   *
   * @param {string} category  'easy' | 'medium' | 'hard'
   * @returns {{ a: number, b: number, answer: number, tableRow: number, category: string }}
   */
  generateProblem(category) {
    const pool = this._pools[category];

    // If pool has no problems for this category, fall back to easy or random
    if (!pool || pool.length === 0) {
      return this._fallbackProblem(category);
    }

    // Find the next unused entry
    let entry = null;
    for (let i = 0; i < pool.length; i++) {
      if (!this._used[category].has(pool[i].key)) {
        entry = pool[i];
        this._used[category].add(entry.key);
        break;
      }
    }

    // If all used, reset and take the first from the recycled pool
    if (!entry) {
      this._resetPool(category);
      entry = pool[0];
      this._used[category].add(entry.key);
    }

    return {
      a:        entry.a,
      b:        entry.b,
      answer:   entry.answer,
      tableRow: entry.tableRow,
      category: entry.category,
    };
  },

  /**
   * Alias used by other systems – generates a problem for any active category.
   * @param {string} category
   * @returns {{ a: number, b: number, answer: number, tableRow: number }}
   */
  generateForCategory(category) {
    return this.generateProblem(category);
  },

  /**
   * Produces a random problem when the normal pool is empty or missing.
   * Uses any active row if available, otherwise uses row 1.
   * @param {string} category
   * @returns {Object}
   */
  _fallbackProblem(category) {
    const rows = this._activeRows.length > 0 ? this._activeRows : [1];
    const row = rows[Math.floor(Math.random() * rows.length)];
    const m   = Math.floor(Math.random() * 10) + 1;
    return {
      a:        row,
      b:        m,
      answer:   row * m,
      tableRow: row,
      category: category,
    };
  },

  // ------------------------------------------------------------------
  // Category lookup
  // ------------------------------------------------------------------

  /**
   * Returns the category string ('easy' | 'medium' | 'hard') for a row.
   * Defaults to 'easy' for unknown rows.
   * @param {number} row
   * @returns {string}
   */
  getCategoryForRow(row) {
    for (const [cat, rows] of Object.entries(CONSTANTS.CATEGORY_ROWS)) {
      if (rows.includes(row)) return cat;
    }
    return CONSTANTS.CATEGORY_EASY;
  },

  // ------------------------------------------------------------------
  // Statistics recording
  // ------------------------------------------------------------------

  /**
   * Records a math answer in the active profile's stats.
   * Also maintains a recentHistory array (capped at 10 entries) per row
   * for trend analysis.
   *
   * @param {number}  tableRow  The multiplication table row (1-10)
   * @param {boolean} correct   Whether the answer was correct
   * @param {number}  timeMs    Time taken to answer in milliseconds
   */
  recordAnswer(tableRow, correct, timeMs) {
    const profile = ProfileSystem.getActive();
    if (!profile) return;

    const stats = ProfileSystem.getMathStats(profile.id);
    const key   = String(tableRow);

    if (!stats[key]) {
      stats[key] = {
        attempts:      0,
        correct:       0,
        totalTimeMs:   0,
        lastPlayed:    null,
        recentHistory: [],
      };
    }

    const row = stats[key];
    row.attempts    += 1;
    row.correct     += correct ? 1 : 0;
    row.totalTimeMs += timeMs;
    row.lastPlayed   = Date.now();

    // Keep last 10 results for trend calculation
    row.recentHistory.push(correct);
    if (row.recentHistory.length > 10) {
      row.recentHistory.shift();
    }

    ProfileSystem.saveMathStats(profile.id, stats);
  },

  // ------------------------------------------------------------------
  // Mastery scoring
  // ------------------------------------------------------------------

  /**
   * Calculates a mastery score (0-1) for a single table row.
   * Weighs accuracy 60% and response speed 40%.
   *
   * @param {number} tableRow
   * @param {string} profileId
   * @returns {number} 0-1
   */
  getMasteryScore(tableRow, profileId) {
    const stats = ProfileSystem.getMathStats(profileId)[String(tableRow)];
    if (!stats || stats.attempts === 0) return 0;

    const accuracy  = stats.correct / stats.attempts;
    const avgTime   = stats.totalTimeMs / Math.max(stats.correct, 1);
    const speedScore = Math.max(0, 1 - (avgTime / 5000));

    return accuracy * 0.6 + speedScore * 0.4;
  },

  /**
   * Returns a global mastery score (0-1) averaged across all rows 1-10.
   * @param {string} profileId
   * @returns {number} 0-1
   */
  getGlobalMastery(profileId) {
    let total = 0;
    for (let row = 1; row <= 10; row++) {
      total += this.getMasteryScore(row, profileId);
    }
    return total / 10;
  },

  /**
   * Returns the row number (1-10) with the lowest mastery score
   * for the given profile.  Useful for recommending which row to practise.
   * @param {string} profileId
   * @returns {number}
   */
  getWeakestRow(profileId) {
    let weakestRow   = 1;
    let lowestScore  = Infinity;

    for (let row = 1; row <= 10; row++) {
      const score = this.getMasteryScore(row, profileId);
      if (score < lowestScore) {
        lowestScore = score;
        weakestRow  = row;
      }
    }
    return weakestRow;
  },
};
