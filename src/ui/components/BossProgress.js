// src/ui/components/BossProgress.js

class BossProgress {
  constructor() {
    this.container = document.getElementById('bossProgressContainer');
    this.fill = document.getElementById('bossProgressFill');
    this.text = document.getElementById('bossProgressText');
  }

  update(currentScore, nextBossThreshold) {
    if (!this.container || !this.fill || !this.text) return;

    const percent = Math.min((currentScore / nextBossThreshold) * 100, 100);
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
