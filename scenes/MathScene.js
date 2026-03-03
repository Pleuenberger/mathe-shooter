// =============================================================
// scenes/MathScene.js - Mathe-Shooter
// Math challenge overlay launched in parallel with GameScene.
//
// Receives: { problem: { a, b, answer, tableRow, category },
//             hasShield, shieldData }
//
// Layout:
//   - Dark semi-transparent overlay
//   - Multiplication problem in large text
//   - Answer display field
//   - Countdown bar (5 seconds)
//   - Numpad (7 8 9 / 4 5 6 / 1 2 3 / ← 0 OK)
//   - Optional "Schild nutzen (Q)" button
// =============================================================

class MathScene extends Phaser.Scene {
  constructor() {
    super('MathScene');
  }

  init(data) {
    this.problem    = data.problem;   // { a, b, answer, tableRow, category }
    this.hasShield  = data.hasShield  || false;
    this.shieldData = data.shieldData || null;
  }

  create() {
    // ── overlay + panel ──────────────────────────────────────────
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.65).setScrollFactor(0).setDepth(90);

    const panel = this.add.rectangle(480, 270, 510, 360, 0x1a1a3a)
      .setScrollFactor(0).setDepth(91);
    panel.setStrokeStyle(3, 0x4488ff);

    // ── Category / table-row label ───────────────────────────────
    const catColors = { easy: '#44ff44', medium: '#4488ff', hard: '#aa44ff' };
    const catColor  = catColors[this.problem.category] || '#ffffff';
    const catLabel  = (this.problem.category || '').toUpperCase();

    this.add.text(480, 132, `${catLabel}  —  ${this.problem.tableRow}er-Reihe`, {
      fontSize: '14px',
      fill: catColor,
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    // ── Question text ────────────────────────────────────────────
    this.questionText = this.add.text(
      480, 188,
      `${this.problem.a} × ${this.problem.b} = ?`,
      {
        fontSize: '48px',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    // ── Answer display ───────────────────────────────────────────
    this._answer = '';

    this.answerBg = this.add.rectangle(480, 242, 200, 40, 0x0a0a2a)
      .setScrollFactor(0).setDepth(91);
    this.answerBg.setStrokeStyle(1, 0x4488ff);

    this.answerText = this.add.text(480, 242, '_', {
      fontSize: '30px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92);

    // ── Countdown bar ────────────────────────────────────────────
    this.countdownBg = this.add.rectangle(480, 272, 402, 14, 0x333333)
      .setScrollFactor(0).setDepth(91);

    // Bar starts full (origin left, x = 280 = 480 - 200)
    this.countdownBar = this.add.rectangle(280, 272, 400, 12, 0x44ff44)
      .setScrollFactor(0).setDepth(92).setOrigin(0, 0.5);

    // ── Numpad ───────────────────────────────────────────────────
    this._buildNumpad();

    // ── Shield button ────────────────────────────────────────────
    this._shieldUsed   = false;
    this._shieldBtnBg  = null;
    this._shieldBtnTxt = null;

    if (this.hasShield) {
      this._buildShieldButton();
    }

    // ── Keyboard input ───────────────────────────────────────────
    this.input.keyboard.on('keydown', this._onKey, this);

    // ── Timer state ───────────────────────────────────────────────
    this._startTime = Date.now();
    this._timeLimit = CONSTANTS.MATH_TIME_LIMIT || 5000;
    this._answered  = false;
  }

  // ─────────────────────────────────────────────────────────────
  // _buildNumpad  –  3-column layout:
  //   7  8  9
  //   4  5  6
  //   1  2  3
  //   ← 0  OK
  // ─────────────────────────────────────────────────────────────
  _buildNumpad() {
    const layout = [
      [7, 8, 9],
      [4, 5, 6],
      [1, 2, 3],
      ['←', 0, 'OK'],
    ];
    const startX = 345;
    const startY = 308;
    const btnW   = 72;
    const btnH   = 46;
    const gapX   = 8;
    const gapY   = 7;

    layout.forEach((row, ri) => {
      row.forEach((val, ci) => {
        const bx = startX + ci * (btnW + gapX);
        const by = startY + ri * (btnH + gapY);

        const isOK    = val === 'OK';
        const baseCol = isOK ? 0x44aa44 : 0x2a3a5a;
        const hoverCol = isOK ? 0x55cc55 : 0x3a4a7a;

        const btn = this.add.rectangle(bx, by, btnW, btnH, baseCol)
          .setScrollFactor(0).setDepth(92).setInteractive({ useHandCursor: true });

        this.add.text(bx, by, String(val), {
          fontSize: isOK ? '18px' : '22px',
          fill: '#ffffff',
          stroke: '#000',
          strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(93);

        btn.on('pointerdown', () => this._handleInput(val));
        btn.on('pointerover', () => btn.setFillStyle(hoverCol));
        btn.on('pointerout',  () => btn.setFillStyle(baseCol));
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // _buildShieldButton
  // ─────────────────────────────────────────────────────────────
  _buildShieldButton() {
    this._shieldBtnBg = this.add.rectangle(480, 428, 250, 38, 0x886600)
      .setScrollFactor(0).setDepth(92).setInteractive({ useHandCursor: true });

    this._shieldBtnTxt = this.add.text(480, 428, STRINGS.MATH_SHIELD_BTN, {
      fontSize: '14px',
      fill: '#ffcc00',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(93);

    this._shieldBtnBg.on('pointerdown', () => this._activateShield());
    this._shieldBtnBg.on('pointerover', () => this._shieldBtnBg.setFillStyle(0xaa8800));
    this._shieldBtnBg.on('pointerout',  () => {
      if (!this._shieldUsed) this._shieldBtnBg.setFillStyle(0x886600);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // _activateShield
  // ─────────────────────────────────────────────────────────────
  _activateShield() {
    if (this._shieldUsed) return;
    this._shieldUsed = true;

    const shield = InventorySystem.useShield();
    if (shield) {
      EventBus.emit('SHIELD_ACTIVATED', { protection: shield.protection });
    }

    if (this._shieldBtnBg)  this._shieldBtnBg.setFillStyle(0x338800);
    if (this._shieldBtnTxt) this._shieldBtnTxt.setText('Schild aktiv!');
  }

  // ─────────────────────────────────────────────────────────────
  // _onKey – physical keyboard
  // ─────────────────────────────────────────────────────────────
  _onKey(event) {
    if (this._answered) return;

    const key = event.key;
    if (key >= '0' && key <= '9') {
      this._handleInput(parseInt(key, 10));
    } else if (key === 'Backspace' || key === 'Delete') {
      this._handleInput('←');
    } else if (key === 'Enter') {
      this._handleInput('OK');
    } else if (key === 'q' || key === 'Q') {
      this._activateShield();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // _handleInput
  // ─────────────────────────────────────────────────────────────
  _handleInput(val) {
    if (this._answered) return;

    if (val === '←') {
      this._answer = this._answer.slice(0, -1);
    } else if (val === 'OK') {
      this._submit();
      return;
    } else {
      if (this._answer.length < 3) {
        this._answer += String(val);
      }
    }

    this.answerText.setText(this._answer.length > 0 ? this._answer : '_');
  }

  // ─────────────────────────────────────────────────────────────
  // _submit
  // ─────────────────────────────────────────────────────────────
  _submit() {
    if (this._answered) return;
    this._answered = true;

    const timeMs  = Date.now() - this._startTime;
    const typed   = parseInt(this._answer, 10);
    const correct = !isNaN(typed) && typed === this.problem.answer;

    // Record result in MathSystem
    if (typeof MathSystem.recordAnswer === 'function') {
      MathSystem.recordAnswer(this.problem.tableRow, correct, timeMs);
    }

    // Play audio feedback
    if (correct) {
      AudioSystem.correct();
    } else {
      AudioSystem.wrong();
    }

    // Feedback text
    let feedbackStr;
    if (correct) {
      if      (timeMs < 2000) feedbackStr = `RICHTIG! +${CONSTANTS.HP_REGEN_FAST} HP`;
      else if (timeMs < 3000) feedbackStr = `RICHTIG! +${CONSTANTS.HP_REGEN_MED} HP`;
      else if (timeMs < 4000) feedbackStr = `RICHTIG! +${CONSTANTS.HP_REGEN_SLOW} HP`;
      else                    feedbackStr = 'RICHTIG!';
    } else {
      feedbackStr = this._answer.length > 0 ? 'FALSCH!' : 'ZEIT!';
    }

    const feedbackColor = correct ? '#44ff44' : '#ff4444';

    this.add.text(480, 238, feedbackStr, {
      fontSize: '28px',
      fill: feedbackColor,
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(95);

    // Emit result and close scene after short delay
    this.time.delayedCall(800, () => {
      EventBus.emit('MATH_RESULT', {
        correct,
        tableRow: this.problem.tableRow,
        timeMs,
      });
      this.scene.stop();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // update – countdown bar animation
  // ─────────────────────────────────────────────────────────────
  update() {
    if (this._answered) return;

    const elapsed = Date.now() - this._startTime;
    const ratio   = Math.max(0, 1 - elapsed / this._timeLimit);

    this.countdownBar.setDisplaySize(ratio * 400, 12);

    // Bar colour: green → yellow → red
    if (ratio > 0.5) {
      this.countdownBar.setFillStyle(0x44ff44);
    } else if (ratio > 0.25) {
      this.countdownBar.setFillStyle(0xffcc00);
    } else {
      this.countdownBar.setFillStyle(0xff4444);
    }

    // Time expired → auto-submit
    if (elapsed >= this._timeLimit) {
      this._submit();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // shutdown
  // ─────────────────────────────────────────────────────────────
  shutdown() {
    this.input.keyboard.off('keydown', this._onKey, this);
  }
}
