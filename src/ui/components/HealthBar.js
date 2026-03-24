// src/ui/components/HealthBar.js

class HealthBar {
  constructor() {
    this.container = document.getElementById('healthBarContainer');
    this.fill = document.getElementById('healthBarFill');
    this.text = document.getElementById('healthBarText');
  }

  update(current, max) {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    this.fill.style.width = `${percent}%`;
    this.text.textContent = `${Math.ceil(current)}/${max}`;
    
    // Цвет в зависимости от % HP
    this.fill.className = 'health-bar-fill';
    if (percent <= 30) {
      this.fill.classList.add('critical');
      this.startPulse();
    } else if (percent <= 60) {
      this.fill.classList.add('medium');
      this.stopPulse();
    } else {
      this.fill.classList.add('normal');
      this.stopPulse();
    }
  }

  startPulse() {
    this.fill.classList.add('pulse');
  }

  stopPulse() {
    this.fill.classList.remove('pulse');
  }

  flashDamage() {
    this.fill.classList.add('damage-flash');
    setTimeout(() => this.fill.classList.remove('damage-flash'), 100);
  }
}

export default HealthBar;
