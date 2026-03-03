// =============================================================
// js/analytics.js - Mathe-Sheriff
// Analytics helper used exclusively by dashboard.html.
// Pure JS – no Phaser, no external dependencies.
// =============================================================

window.Analytics = {
  STORAGE_KEY: 'mathe_sheriff_profiles',
  ACTIVE_KEY:  'mathe_sheriff_active_profile',

  // ------------------------------------------------------------------
  // Profile loading
  // ------------------------------------------------------------------

  /**
   * Load and return all profiles from localStorage.
   * Returns an empty array if nothing is stored or parsing fails.
   * @returns {Object[]}
   */
  getProfiles() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Return the currently active profile, or the first profile if no
   * active id is stored, or null if there are no profiles at all.
   * @returns {Object|null}
   */
  getActiveProfile() {
    const profiles = this.getProfiles();
    if (profiles.length === 0) return null;

    const activeId = localStorage.getItem(this.ACTIVE_KEY);
    if (activeId) {
      const found = profiles.find(p => p.id === activeId);
      if (found) return found;
    }

    // Fall back to first profile
    return profiles[0];
  },

  // ------------------------------------------------------------------
  // Mastery scoring
  // ------------------------------------------------------------------

  /**
   * Calculate a 0-1 mastery score for a single multiplication-table row.
   * Combines accuracy (60 %) with a speed component (40 %).
   * A perfect answer in < 1 s scores 1.0; 5 s or more scores 0.0 for speed.
   *
   * @param {Object|null} stats  A mathStats entry for one row
   * @returns {number}  0-1
   */
  getMasteryScore(stats) {
    if (!stats || stats.attempts === 0) return 0;

    const accuracy  = stats.correct / stats.attempts;
    const avgTimeMs = stats.totalTimeMs / Math.max(stats.correct, 1);
    const speedScore = Math.max(0, 1 - avgTimeMs / 5000);

    return accuracy * 0.6 + speedScore * 0.4;
  },

  // ------------------------------------------------------------------
  // Score level labelling
  // ------------------------------------------------------------------

  /**
   * Map a 0-1 mastery score to a human-readable label and CSS colour.
   *
   * Thresholds (matching CONSTANTS in the game):
   *   >= 0.90  →  Meister!
   *   >= 0.70  →  Sehr gut!
   *   >= 0.40  →  Gut!
   *   >  0     →  Noch üben
   *      0     →  Noch nicht gespielt
   *
   * @param {number} score
   * @returns {{ label: string, color: string, class: string }}
   */
  getScoreLevel(score) {
    if (score >= 0.90) return { label: 'Meister! ⭐',          color: '#FFD700', cssClass: 'master'      };
    if (score >= 0.70) return { label: 'Sehr gut! ✅',          color: '#44cc44', cssClass: 'very-good'   };
    if (score >= 0.40) return { label: 'Gut! 👍',              color: '#ff8800', cssClass: 'good'        };
    if (score >  0)    return { label: 'Noch üben ❗',          color: '#ff4444', cssClass: 'practice'    };
    return                    { label: 'Noch nicht gespielt ❓', color: '#888888', cssClass: 'not-played'  };
  },

  // ------------------------------------------------------------------
  // Trend analysis
  // ------------------------------------------------------------------

  /**
   * Compare the first half of recentHistory with the second half and
   * determine whether performance is improving, declining, or stable.
   *
   * @param {boolean[]|null} recentHistory  Array of true/false results
   * @returns {'up'|'down'|'neutral'}
   */
  getTrend(recentHistory) {
    if (!recentHistory || recentHistory.length < 4) return 'neutral';

    const mid        = Math.floor(recentHistory.length / 2);
    const firstHalf  = recentHistory.slice(0, mid);
    const secondHalf = recentHistory.slice(mid);

    const firstRate  = firstHalf.filter(Boolean).length  / firstHalf.length;
    const secondRate = secondHalf.filter(Boolean).length / secondHalf.length;

    if (secondRate - firstRate >  0.15) return 'up';
    if (firstRate  - secondRate > 0.15) return 'down';
    return 'neutral';
  },

  // ------------------------------------------------------------------
  // Aggregate progress
  // ------------------------------------------------------------------

  /**
   * Return the overall 0-1 progress score averaged across all 10 rows.
   * Rows with no attempts contribute 0 to the average.
   *
   * @param {Object|null} profile
   * @returns {number}
   */
  getOverallProgress(profile) {
    if (!profile || !profile.mathStats) return 0;

    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r =>
      this.getMasteryScore(profile.mathStats[String(r)])
    );

    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  },

  /**
   * Return the total number of stars earned across all levels.
   * @param {Object|null} profile
   * @returns {number}
   */
  getTotalStars(profile) {
    if (!profile || !profile.levelStars) return 0;
    return Object.values(profile.levelStars).reduce((sum, s) => sum + (s || 0), 0);
  },

  /**
   * Return the number of the highest level that has at least 1 star.
   * Returns 1 if no level has been completed yet.
   *
   * @param {Object|null} profile
   * @returns {number}
   */
  getHighestLevel(profile) {
    if (!profile || !profile.levelStars) return 1;

    const completedLevels = Object.keys(profile.levelStars)
      .map(Number)
      .filter(lvl => profile.levelStars[String(lvl)] > 0);

    return completedLevels.length > 0 ? Math.max(...completedLevels) : 1;
  },

  // ------------------------------------------------------------------
  // Last played timestamp
  // ------------------------------------------------------------------

  /**
   * Find the most recent lastPlayed timestamp across all 10 rows.
   * Returns null if no row has ever been played.
   *
   * @param {Object|null} profile
   * @returns {number|null}  Unix timestamp in ms, or null
   */
  getLastPlayed(profile) {
    if (!profile || !profile.mathStats) return null;

    let latest = null;
    for (let r = 1; r <= 10; r++) {
      const s = profile.mathStats[String(r)];
      if (s && s.lastPlayed) {
        if (latest === null || s.lastPlayed > latest) {
          latest = s.lastPlayed;
        }
      }
    }
    return latest;
  },

  // ------------------------------------------------------------------
  // Parent recommendation
  // ------------------------------------------------------------------

  /**
   * Generate a short German recommendation text for a parent based on
   * which rows are strong ( >= 0.70) and which are weak ( < 0.40).
   *
   * @param {Object|null} profile
   * @returns {string}
   */
  getRecommendation(profile) {
    if (!profile || !profile.mathStats) {
      return 'Noch keine Daten vorhanden. Bitte erst ein paar Runden spielen!';
    }

    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const strong = rows.filter(r => {
      const s = profile.mathStats[String(r)];
      return s && s.attempts > 0 && this.getMasteryScore(s) >= 0.70;
    });

    const weak = rows.filter(r => {
      const s = profile.mathStats[String(r)];
      return s && s.attempts > 0 && this.getMasteryScore(s) < 0.40;
    });

    const notYetPlayed = rows.filter(r => {
      const s = profile.mathStats[String(r)];
      return !s || s.attempts === 0;
    });

    let rec = '';

    if (strong.length > 0) {
      const rowLabels = strong.map(r => r + 'er').join(', ');
      const plural    = strong.length > 1 ? 'n' : '';
      rec += `${profile.name} hat die ${rowLabels} Reihe${plural} gut gemeistert. `;
    }

    if (weak.length > 0) {
      const rowLabels = weak.map(r => r + 'er').join(', ');
      const plural    = weak.length > 1;
      rec += `Die ${rowLabels} Reihe${plural ? 'n brauchen' : ' braucht'} mehr Übung. `;

      // Suggest the most appropriate level for the weakest row
      const highestWeak = Math.max(...weak);
      const suggestLevel = highestWeak <= 2 ? 1
                         : highestWeak <= 4 ? 3
                         : highestWeak <= 5 ? 5
                         : 6;
      rec += `Tipp: Level ${suggestLevel}–${Math.min(10, suggestLevel + 2)} nochmal spielen!`;
    }

    if (notYetPlayed.length > 0 && notYetPlayed.length < 10) {
      const rowLabels = notYetPlayed.map(r => r + 'er').join(', ');
      rec += ` Die ${rowLabels} Reihe${notYetPlayed.length > 1 ? 'n wurden' : ' wurde'} noch nicht geübt.`;
    }

    if (!rec) {
      rec = `${profile.name} macht super Fortschritte! Weiter so! 🎉`;
    }

    return rec.trim();
  },

  // ------------------------------------------------------------------
  // Formatting helpers
  // ------------------------------------------------------------------

  /**
   * Format a Unix timestamp (ms) into a human-readable German date/time
   * string, e.g. "02.03.2026, 14:35 Uhr".
   * Returns '–' if the timestamp is null or falsy.
   *
   * @param {number|null} tsMs
   * @returns {string}
   */
  formatTimestamp(tsMs) {
    if (!tsMs) return '–';
    try {
      const d = new Date(tsMs);
      const pad = n => String(n).padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ` +
             `${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`;
    } catch (e) {
      return '–';
    }
  },

  /**
   * Convert a 0-1 score to a percentage string, e.g. "73 %".
   * @param {number} score
   * @returns {string}
   */
  formatPercent(score) {
    return Math.round(score * 100) + ' %';
  },
};
