// src/ui/components/BossHUD.js

class BossHUD {
  constructor() {
    this.container = document.getElementById('bossHUDContainer');
    this.hpFill = document.getElementById('bossHPFill');
    this.hpText = document.getElementById('bossHPText');
    this.phaseIndicator = document.getElementById('bossPhaseIndicator');
    this.nameText = document.getElementById('bossNameText');
  }

  show(bossName, hp, maxHP, phase) {
    if (!this.container) return;
    this.container.style.display = 'block';
    this.update(hp, maxHP, phase);
    this.nameText.textContent = bossName;
  }

  update(hp, maxHP, phase) {
    if (!this.hpFill || !this.hpText || !this.phaseIndicator) return;

    const percent = Math.min((hp / maxHP) * 100, 100);
    this.hpFill.style.width = `${percent}%`;
    this.hpText.textContent = `${hp.toLocaleString('ru-RU')} / ${maxHP.toLocaleString('ru-RU')} HP`;
    
    // Индикатор фазы
    const phaseIcons = {
      'PHASE_1': '🔵',
      'PHASE_2': '🔶',
      'PHASE_3': '🔴'
    };
    
    const displayPhase = phase.replace('PHASE_', '');
    this.phaseIndicator.textContent = `ФАЗА: ${displayPhase} ${phaseIcons[phase] || ''}`;
    
    // Цвет фазы
    const phaseColors = {
      'PHASE_1': '#00d4ff',
      'PHASE_2': '#ff6b35',
      'PHASE_3': '#ff0000'
    };
    this.phaseIndicator.style.color = phaseColors[phase] || '#FFFFFF';
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }

  flashDamage() {
    if (!this.container) return;
    this.container.classList.add('damage-flash');
    setTimeout(() => {
      if (this.container) this.container.classList.remove('damage-flash');
    }, 100);
  }
}

export default BossHUD;
