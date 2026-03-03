// =============================================================
// systems/InventorySystem.js - Mathe-Shooter
// Manages 4 weapon slots (slot 0 = club, always) + 1 shield slot.
// Depends on: WEAPONS, EventBus
// =============================================================

window.InventorySystem = {
  /** @type {(Object|null)[]} Four weapon slots; slot 0 always holds the club. */
  slots: [null, null, null, null],

  /** Index of the currently selected weapon slot. */
  activeSlot: 0,

  /** Currently held shield item, or null. */
  shieldSlot: null,

  // ------------------------------------------------------------------
  // Initialisation
  // ------------------------------------------------------------------

  /**
   * Set up the inventory with club in slot 0 and everything else empty.
   * Call at the start of every level.
   */
  init() {
    this.slots      = [{ ...WEAPONS.club }, null, null, null];
    this.activeSlot = 0;
    this.shieldSlot = null;
    this.reloadTimers = {};
  },

  // ------------------------------------------------------------------
  // Active weapon
  // ------------------------------------------------------------------

  /**
   * Returns the weapon in the currently active slot.
   * Falls back to slot 0 (club) if the active slot is empty.
   * @returns {Object}
   */
  getActive() {
    return this.slots[this.activeSlot] || this.slots[0];
  },

  /**
   * Switch the active slot.
   * Does nothing if the slot is out of range or empty (and not slot 0).
   * @param {number} slotIndex 0-3
   */
  switchTo(slotIndex) {
    if (slotIndex < 0 || slotIndex > 3) return;
    if (slotIndex !== 0 && this.slots[slotIndex] === null) return;
    this.activeSlot = slotIndex;
    EventBus.emit('INVENTORY_CHANGED', this.slots);
  },

  // ------------------------------------------------------------------
  // Weapon pickup & dropping
  // ------------------------------------------------------------------

  /**
   * Attempt to pick up a weapon item.
   *
   * Strategy:
   *  1. Try to find an empty slot (slots 1-3 only; slot 0 is always the club).
   *  2. If all slots 1-3 are occupied, swap with the weapon in the active slot
   *     (or slot 1 if active slot is 0).
   *
   * @param {Object} weaponData  A copy of a WEAPONS entry (or compatible object)
   * @returns {Object|null} The weapon that was dropped to make room, or null.
   */
  pickUpWeapon(weaponData) {
    let dropped = null;

    // Look for the first empty slot among slots 1-3
    const emptySlot = this.slots.findIndex((s, i) => i > 0 && s === null);

    if (emptySlot !== -1) {
      // Place into the empty slot
      this.slots[emptySlot] = { ...weaponData };
      // Auto-switch to the new weapon
      this.activeSlot = emptySlot;
    } else {
      // All slots taken – swap with active slot (but never slot 0)
      const swapSlot = this.activeSlot === 0 ? 1 : this.activeSlot;
      dropped = this.slots[swapSlot];
      this.slots[swapSlot] = { ...weaponData };
      this.activeSlot = swapSlot;
    }

    // Cancel any in-progress reload for the slot we just wrote to
    const targetSlot = this.activeSlot;
    if (this.reloadTimers[targetSlot]) {
      clearTimeout(this.reloadTimers[targetSlot].timer);
      delete this.reloadTimers[targetSlot];
    }

    EventBus.emit('INVENTORY_CHANGED', this.slots);
    return dropped;
  },

  /**
   * Remove and return the weapon in a given slot.
   * Slot 0 (club) cannot be dropped.
   * @param {number} slotIndex 1-3
   * @returns {Object|null} The dropped weapon or null.
   */
  dropWeapon(slotIndex) {
    if (slotIndex === 0) return null; // club not droppable
    if (slotIndex < 0 || slotIndex > 3) return null;

    const w = this.slots[slotIndex];
    if (!w) return null;

    this.slots[slotIndex] = null;

    // If we dropped the active slot, fall back to slot 0
    if (this.activeSlot === slotIndex) {
      this.activeSlot = 0;
    }

    // Cancel reload timer if active
    if (this.reloadTimers[slotIndex]) {
      clearTimeout(this.reloadTimers[slotIndex].timer);
      delete this.reloadTimers[slotIndex];
    }

    EventBus.emit('INVENTORY_CHANGED', this.slots);
    return w;
  },

  // ------------------------------------------------------------------
  // Shield
  // ------------------------------------------------------------------

  /**
   * Pick up a shield item, replacing the old one if present.
   * @param {Object} shieldData  A copy of a SHIELDS entry
   * @returns {Object|null} The previously held shield (to drop in world), or null.
   */
  pickUpShield(shieldData) {
    const old        = this.shieldSlot;
    this.shieldSlot  = { ...shieldData };
    EventBus.emit('INVENTORY_CHANGED', this.slots);
    return old;
  },

  /**
   * Consume the currently held shield (e.g. when it blocks damage).
   * @returns {Object|null} The consumed shield, or null if none was held.
   */
  useShield() {
    const s         = this.shieldSlot;
    this.shieldSlot = null;
    EventBus.emit('INVENTORY_CHANGED', this.slots);
    return s;
  },

  // ------------------------------------------------------------------
  // Utility
  // ------------------------------------------------------------------

  /**
   * Returns true if at least one of slots 1-3 is empty.
   * Used to decide whether an item should be auto-picked up.
   * @returns {boolean}
   */
  hasEmptySlot() {
    return this.slots.some((s, i) => i > 0 && s === null);
  },

  /**
   * Returns the best weapon currently in the inventory, ranked by
   * tier first (higher is better) then damage.
   * @returns {Object|null}
   */
  getBestWeapon() {
    return this.slots.filter(Boolean).reduce((best, w) => {
      if (!best) return w;
      if (w.tier > best.tier) return w;
      if (w.tier === best.tier && w.damage > best.damage) return w;
      return best;
    }, null);
  },

  /**
   * Carry the best non-club weapon into the next level.
   * Resets to club-only first, then puts the best weapon in slot 1.
   * Shield is always cleared between levels.
   */
  prepareForNextLevel() {
    const best = this.getBestWeapon();

    this.slots      = [{ ...WEAPONS.club }, null, null, null];
    this.shieldSlot = null;
    this.reloadTimers = {};

    if (best && best.id !== 'club') {
      this.slots[1] = { ...best };
      this.activeSlot = 1;
    } else {
      this.activeSlot = 0;
    }

    EventBus.emit('INVENTORY_CHANGED', this.slots);
  },

  // ------------------------------------------------------------------
  // Reload system
  // ------------------------------------------------------------------

  /**
   * Map of slotIndex → { remaining: ms, total: ms, timer: timeoutId }
   * @type {Object}
   */
  reloadTimers: {},

  /**
   * Begin a reload animation/timer for the weapon in a given slot.
   * Fires RELOAD_COMPLETE via EventBus when done.
   * Does nothing if the slot is empty or already reloading.
   *
   * @param {number} slotIndex 0-3
   */
  startReload(slotIndex) {
    const weapon = this.slots[slotIndex];
    if (!weapon) return;
    if (this.isReloading(slotIndex)) return;
    if (!weapon.reloadMs || weapon.reloadMs <= 0) return; // melee / no reload needed

    const duration = weapon.reloadMs;

    EventBus.emit('RELOAD_START', { slot: slotIndex, duration });

    const timer = setTimeout(() => {
      this.completeReload(slotIndex);
    }, duration);

    this.reloadTimers[slotIndex] = {
      remaining: duration,
      total:     duration,
      timer,
    };
  },

  /**
   * Returns true if the weapon in the given slot is currently reloading.
   * @param {number} slotIndex
   * @returns {boolean}
   */
  isReloading(slotIndex) {
    return !!this.reloadTimers[slotIndex];
  },

  /**
   * Called when a reload finishes (internally via setTimeout, or externally).
   * Restores magazine to full and emits RELOAD_COMPLETE.
   * @param {number} slotIndex
   */
  completeReload(slotIndex) {
    delete this.reloadTimers[slotIndex];

    const weapon = this.slots[slotIndex];
    if (weapon) {
      weapon.currentAmmo = weapon.magazineSize;
    }

    EventBus.emit('RELOAD_COMPLETE', { slot: slotIndex });
    EventBus.emit('INVENTORY_CHANGED', this.slots);
  },
};
