// src/ui/components/BossProgress.js

class BossProgress {
  constructor() {
    this.container = document.getElementById('bossProgressContainer');
    this.fill = document.getElementById('bossProgressFill');
    this.text = document.getElementById('bossProgressText');
  }

  /**
   * @param {number} currentScore — текущий счёт
   * @param {number} nextBossThreshold — абсолютный счёт появления босса
   * @param {number} baseline — счёт после предыдущего босса (начало интервала)
   */
  update(currentScore, nextBossThreshold, baseline = 0) {
    if (!this.container || !this.fill || !this.text) return;

    const span = Math.max(1, nextBossThreshold - baseline);
    const gained = Math.max(0, currentScore - baseline);
    const percent = Math.min((gained / span) * 100, 100);
    this.fill.style.width = `${percent}%`;
    this.text.textContent = `ДО БОССА: ${this.formatNumber(currentScore)} / ${this.formatNumber(nextBossThreshold)}`;
    
    // Визуальное предупреждение при 90%+
    if (percent >= 90) {
      this.container.classList.add('warning');
    } else {
      this.container.classList.remove('warning');
    }
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }

  show() {
    if (this.container) this.container.style.display = 'block';
  }

  formatNumber(num) {
    return num.toLocaleString('ru-RU');
  }
}

export default BossProgress;
