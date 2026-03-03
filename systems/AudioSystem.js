// =============================================================
// systems/AudioSystem.js - Mathe-Shooter
// Simple procedural sound effects using the Web Audio API.
// No external assets required.
// =============================================================

window.AudioSystem = {
  /** @type {AudioContext|null} */
  _ctx:     null,
  _enabled: true,

  // ------------------------------------------------------------------
  // Initialisation
  // ------------------------------------------------------------------

  /**
   * Create the AudioContext.
   * Call once during game boot (e.g. on first user interaction to satisfy
   * browser autoplay policies, or inside BootScene.create()).
   */
  init() {
    if (this._ctx) return; // already initialised
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Web Audio API not available (very old browser or test environment)
      this._enabled = false;
    }
  },

  // ------------------------------------------------------------------
  // Low-level primitives
  // ------------------------------------------------------------------

  /**
   * Play a single tone.
   *
   * @param {number} frequency   Frequency in Hz
   * @param {number} duration    Duration in seconds
   * @param {OscillatorType} [type='square']  Waveform type
   * @param {number} [volume=0.3]  Gain (0-1)
   */
  _play(frequency, duration, type, volume) {
    if (!this._enabled || !this._ctx) return;

    // Resume context if it was suspended (browser autoplay policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }

    type   = type   || 'square';
    volume = volume !== undefined ? volume : 0.3;

    try {
      const oscillator = this._ctx.createOscillator();
      const gainNode   = this._ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this._ctx.destination);

      oscillator.type      = type;
      oscillator.frequency.setValueAtTime(frequency, this._ctx.currentTime);

      // Smooth envelope: fast attack, held sustain, short release
      const now     = this._ctx.currentTime;
      const release = Math.min(0.05, duration * 0.2);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);          // attack
      gainNode.gain.setValueAtTime(volume, now + duration - release);      // sustain
      gainNode.gain.linearRampToValueAtTime(0, now + duration);            // release

      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch (e) {
      // Ignore errors from rapid calls (e.g. too many nodes)
    }
  },

  /**
   * Play multiple tones simultaneously (a chord).
   *
   * @param {number[]} notes      Array of frequencies in Hz
   * @param {number}   duration   Duration in seconds
   * @param {OscillatorType} [type='square']
   * @param {number}   [volume]   Per-note gain (auto-scaled by note count if omitted)
   */
  _chord(notes, duration, type, volume) {
    if (!this._enabled || !this._ctx) return;
    if (!notes || notes.length === 0) return;

    // Auto-scale volume so the chord doesn't clip
    const perNoteVolume = volume !== undefined
      ? volume
      : Math.min(0.3, 0.6 / notes.length);

    notes.forEach(freq => {
      this._play(freq, duration, type || 'square', perNoteVolume);
    });
  },

  // ------------------------------------------------------------------
  // Game sound effects
  // ------------------------------------------------------------------

  /** Weapon fire – short high-pitched burst. */
  shoot() {
    this._play(800, 0.05, 'square', 0.2);
  },

  /** Enemy takes a hit – low sawtooth thud. */
  enemyHit() {
    this._play(200, 0.1, 'sawtooth', 0.3);
  },

  /** Correct math answer – bright C-E-G major chord. */
  correct() {
    this._chord([523, 659, 784], 0.3); // C5, E5, G5
  },

  /** Wrong math answer – low buzzing descending tone. */
  wrong() {
    if (!this._enabled || !this._ctx) return;
    // Descend from 300 to 150 Hz over 0.4 s for a "wrong" feel
    try {
      if (this._ctx.state === 'suspended') this._ctx.resume();

      const oscillator = this._ctx.createOscillator();
      const gainNode   = this._ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this._ctx.destination);

      oscillator.type = 'sawtooth';

      const now = this._ctx.currentTime;
      oscillator.frequency.setValueAtTime(300, now);
      oscillator.frequency.linearRampToValueAtTime(150, now + 0.4);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

      oscillator.start(now);
      oscillator.stop(now + 0.42);
    } catch (e) {
      // fallback
      this._play(200, 0.4, 'sawtooth', 0.4);
    }
  },

  /** Item picked up – bright high ping. */
  pickup() {
    this._play(1047, 0.15, 'sine', 0.3); // C6
  },

  /** Player loses a heart/life – low triangle thud. */
  heartLost() {
    this._play(150, 0.3, 'triangle', 0.4);
  },

  /**
   * Boss defeated – ascending fanfare:
   * C4+E4+G4 chord, then a held C5.
   */
  bossDie() {
    this._chord([262, 330, 392], 0.2); // C4, E4, G4
    setTimeout(() => {
      this._play(523, 0.5, 'square', 0.4); // C5
    }, 300);
  },

  /** Weapon reload start – quick click. */
  reload() {
    this._play(400, 0.05, 'triangle', 0.15);
  },

  /** Player jumps – short rising sine swoop. */
  jump() {
    if (!this._enabled || !this._ctx) return;
    try {
      if (this._ctx.state === 'suspended') this._ctx.resume();

      const oscillator = this._ctx.createOscillator();
      const gainNode   = this._ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this._ctx.destination);

      oscillator.type = 'sine';

      const now = this._ctx.currentTime;
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

      oscillator.start(now);
      oscillator.stop(now + 0.12);
    } catch (e) {
      this._play(600, 0.1, 'sine', 0.2);
    }
  },

  /** Chest opens (used before math question appears). */
  chestOpen() {
    this._chord([440, 550], 0.15, 'sine', 0.2);
  },

  /** Short stinger when player takes damage. */
  playerHit() {
    this._play(180, 0.15, 'sawtooth', 0.35);
  },

  /** Shield block – metallic clang. */
  shieldBlock() {
    this._chord([880, 660], 0.1, 'square', 0.15);
  },

  /** Level complete jingle – quick ascending run. */
  levelComplete() {
    const notes    = [262, 330, 392, 523];
    const interval = 120; // ms between notes
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._play(freq, 0.25, 'square', 0.3);
      }, i * interval);
    });
  },

  // ------------------------------------------------------------------
  // Toggle
  // ------------------------------------------------------------------

  /**
   * Toggle sound on/off globally.
   * @returns {boolean} New enabled state.
   */
  toggle() {
    this._enabled = !this._enabled;

    if (this._ctx) {
      if (this._enabled) {
        this._ctx.resume().catch(() => {});
      } else {
        this._ctx.suspend().catch(() => {});
      }
    }

    return this._enabled;
  },

  /**
   * Returns whether sound is currently enabled.
   * @returns {boolean}
   */
  isEnabled() {
    return this._enabled;
  },
};
