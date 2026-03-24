// src/ui/components/BossBar.js

class BossBar {
  constructor() {
    this.container = document.getElementById('bossBarContainer');
    this.fill = document.getElementById('bossBarFill');
    this.text = document.getElementById('bossBarText');
    this.maxHP = 100;
  }

  show(hp, max) {
    if (this.container) {
      this.container.style.display = 'flex';
      this.update(hp, max);
    }
  }

  update(hp, max = null) {
    if (max !== null) {
      this.maxHP = max;
    }
    const percent = Math.max(0, Math.min(100, (hp / this.maxHP) * 100));
    if (this.fill) this.fill.style.width = `${percent}%`;
    if (this.text) this.text.textContent = `${Math.ceil(hp)}/${this.maxHP}`;
    
    // Мигание при получении урона
    this.flash();
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }

  flash() {
    if (this.container) {
      this.container.classList.add('flash');
      setTimeout(() => this.container.classList.remove('flash'), 150);
    }
  }
}

export default BossBar;
