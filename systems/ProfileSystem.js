// =============================================================
// systems/ProfileSystem.js - Mathe-Shooter
// Manages up to 4 player profiles with localStorage persistence.
// =============================================================

window.ProfileSystem = {
  STORAGE_KEY: 'mathe_sheriff_profiles',
  ACTIVE_KEY:  'mathe_sheriff_active_profile',
  MAX_PROFILES: 4,
  AVATAR_COLORS: [
    { id: 'blue',   label: 'Blau', value: 0x4488ff, texture: 'player'        },
    { id: 'red',    label: 'Rot',  value: 0xff4444, texture: 'player_red'    },
    { id: 'green',  label: 'Grün', value: 0x44cc44, texture: 'player_green'  },
    { id: 'yellow', label: 'Gelb', value: 0xffcc00, texture: 'player_yellow' },
  ],

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  /** Load raw profiles array from localStorage. */
  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  /** Persist profiles array to localStorage. */
  _save(profiles) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      // Quota exceeded or private mode – fail silently
    }
  },

  /** Generate a uuid-like id. */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Returns the array of all stored profiles (up to MAX_PROFILES).
   * @returns {Object[]}
   */
  getProfiles() {
    return this._load();
  },

  /**
   * Creates a new profile with the given name and colorId.
   * Does nothing if MAX_PROFILES is already reached.
   * @param {string} name
   * @param {string} colorId
   * @returns {Object|null} The created profile or null if limit reached.
   */
  createProfile(name, colorId) {
    const profiles = this._load();
    if (profiles.length >= this.MAX_PROFILES) return null;

    const profile = this._createEmptyProfile(name, colorId);
    profiles.push(profile);
    this._save(profiles);
    return profile;
  },

  /**
   * Deletes the profile with the given id.
   * If the deleted profile was active, clears the active key.
   * @param {string} id
   */
  deleteProfile(id) {
    let profiles = this._load();
    profiles = profiles.filter(p => p.id !== id);
    this._save(profiles);

    // Clear active if it was this profile
    if (localStorage.getItem(this.ACTIVE_KEY) === id) {
      localStorage.removeItem(this.ACTIVE_KEY);
    }
  },

  /**
   * Sets the active profile by id.
   * @param {string} id
   */
  setActive(id) {
    try {
      localStorage.setItem(this.ACTIVE_KEY, id);
    } catch (e) {
      // fail silently
    }
  },

  /**
   * Returns the currently active profile object, or null if none.
   * @returns {Object|null}
   */
  getActive() {
    const id = localStorage.getItem(this.ACTIVE_KEY);
    if (!id) return null;
    const profiles = this._load();
    return profiles.find(p => p.id === id) || null;
  },

  /**
   * Returns mathStats for a profile (or the active profile if no id given).
   * mathStats keys are stringified row numbers ("1".."10").
   * @param {string} [profileId]
   * @returns {Object}
   */
  getMathStats(profileId) {
    const profile = profileId
      ? this._load().find(p => p.id === profileId)
      : this.getActive();
    if (!profile) return this._emptyMathStats();
    return profile.mathStats || this._emptyMathStats();
  },

  /**
   * Saves updated mathStats back into a profile.
   * @param {string} profileId
   * @param {Object} stats
   */
  saveMathStats(profileId, stats) {
    const profiles = this._load();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return;
    profiles[idx].mathStats = stats;
    this._save(profiles);
  },

  /**
   * Returns the level progress for a profile.
   * @param {string} [profileId]
   * @returns {{ stars: Object, totalStars: number, highestLevel: number }}
   */
  getLevelProgress(profileId) {
    const profile = profileId
      ? this._load().find(p => p.id === profileId)
      : this.getActive();
    if (!profile) return { stars: {}, totalStars: 0, highestLevel: 1 };

    const levelStars = profile.levelStars || {};
    let totalStars = 0;
    let highestLevel = 1;

    for (const [lvlStr, s] of Object.entries(levelStars)) {
      totalStars += s;
      const lvlNum = parseInt(lvlStr, 10);
      if (s > 0 && lvlNum >= highestLevel) {
        highestLevel = lvlNum + 1; // next level is the highest reached
      }
    }
    highestLevel = Math.min(highestLevel, 10); // cap at 10

    return { stars: levelStars, totalStars, highestLevel };
  },

  /**
   * Saves (or updates) the star count for a given level.
   * Only saves if the new star count is better than the stored one.
   * @param {string} profileId
   * @param {number|string} levelId
   * @param {number} stars 0-3
   */
  saveLevelStars(profileId, levelId, stars) {
    const profiles = this._load();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return;

    if (!profiles[idx].levelStars) profiles[idx].levelStars = {};
    const key = String(levelId);
    const existing = profiles[idx].levelStars[key] || 0;
    profiles[idx].levelStars[key] = Math.max(existing, stars);
    this._save(profiles);
  },

  /**
   * Returns the best weapon id for a profile (default 'club').
   * @param {string} [profileId]
   * @returns {string}
   */
  getBestWeapon(profileId) {
    const profile = profileId
      ? this._load().find(p => p.id === profileId)
      : this.getActive();
    if (!profile) return 'club';
    return profile.bestWeapon || 'club';
  },

  /**
   * Saves the best weapon id for a profile.
   * @param {string} profileId
   * @param {string} weaponId
   */
  saveBestWeapon(profileId, weaponId) {
    const profiles = this._load();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return;
    profiles[idx].bestWeapon = weaponId;
    this._save(profiles);
  },

  /**
   * Returns the current lives count for a profile.
   * @param {string} [profileId]
   * @returns {number}
   */
  getLives(profileId) {
    const profile = profileId
      ? this._load().find(p => p.id === profileId)
      : this.getActive();
    if (!profile) return CONSTANTS.PLAYER_START_LIVES;
    return typeof profile.lives === 'number' ? profile.lives : CONSTANTS.PLAYER_START_LIVES;
  },

  /**
   * Sets the lives count for a profile.
   * @param {string} profileId
   * @param {number} lives
   */
  setLives(profileId, lives) {
    const profiles = this._load();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return;
    profiles[idx].lives = Math.max(0, Math.min(lives, CONSTANTS.PLAYER_MAX_LIVES));
    this._save(profiles);
  },

  /**
   * Returns the current level id (1-10) for a profile.
   * @param {string} [profileId]
   * @returns {number}
   */
  getCurrentLevel(profileId) {
    const profile = profileId
      ? this._load().find(p => p.id === profileId)
      : this.getActive();
    if (!profile) return 1;
    return typeof profile.currentLevel === 'number' ? profile.currentLevel : 1;
  },

  /**
   * Sets the current level id for a profile.
   * @param {string} profileId
   * @param {number} levelId
   */
  setCurrentLevel(profileId, levelId) {
    const profiles = this._load();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return;
    profiles[idx].currentLevel = Math.max(1, Math.min(levelId, 10));
    this._save(profiles);
  },

  /**
   * Returns the total stars earned across all levels for a profile.
   * @param {string} [profileId]
   * @returns {number}
   */
  getTotalStars(profileId) {
    const profile = profileId
      ? this._load().find(p => p.id === profileId)
      : this.getActive();
    if (!profile || !profile.levelStars) return 0;
    return Object.values(profile.levelStars).reduce((sum, s) => sum + s, 0);
  },

  // ------------------------------------------------------------------
  // Private factory helpers
  // ------------------------------------------------------------------

  /**
   * Returns a fresh, empty mathStats object for rows 1-10.
   * @returns {Object}
   */
  _emptyMathStats() {
    const stats = {};
    for (let row = 1; row <= 10; row++) {
      stats[String(row)] = {
        attempts:      0,
        correct:       0,
        totalTimeMs:   0,
        lastPlayed:    null,
        recentHistory: [], // last 10 results: true/false
      };
    }
    return stats;
  },

  /**
   * Constructs and returns a new empty profile object.
   * @param {string} name
   * @param {string} colorId
   * @returns {Object}
   */
  _createEmptyProfile(name, colorId) {
    return {
      id:           this._generateId(),
      name:         name,
      colorId:      colorId,
      createdAt:    Date.now(),
      currentLevel: 1,
      lives:        CONSTANTS.PLAYER_START_LIVES,
      bestWeapon:   'club',
      levelStars:   {},
      mathStats:    this._emptyMathStats(),
    };
  },
};
