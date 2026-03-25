// src/ui/components/PowerUpIcons.js

class PowerUpIcons {
  constructor() {
    this.container = document.getElementById('powerUpsContainer');
    this.activePowerUps = new Map();
  }

  add(type, duration) {
    // Удаляем существующий такой же бонус
    if (this.activePowerUps.has(type)) {
      this.remove(type);
    }

    const icon = document.createElement('div');
    icon.className = `powerup-icon ${type}`;
    icon.id = `powerup-${type}`;
    icon.innerHTML = this.getIconForType(type);
    
    // Таймер обратного отсчёта (визуальный)
    icon.dataset.duration = duration;
    icon.dataset.startTime = Date.now();
    
    if (this.container) this.container.appendChild(icon);
    this.activePowerUps.set(type, icon);
    
    // Запускаем анимацию таймера
    this.startTimer(type, duration);
  }

  remove(type) {
    const icon = this.activePowerUps.get(type);
    if (icon) {
      icon.classList.add('fade-out');
      setTimeout(() => {
        icon.remove();
        this.activePowerUps.delete(type);
      }, 200);
    }
  }

  getIconForType(type) {
    const icons = {
      shield: '🛡️',
      speed: '⚡',
      multishot: 'x3',
      repair: '❤️',
      damage: '💥',
      firerate: '🔫'
    };
    return icons[type] || '?';
  }

  startTimer(type, duration) {
    const icon = this.activePowerUps.get(type);
    if (!icon) return;

    const updateTimer = () => {
      const iconNow = this.activePowerUps.get(type);
      if (!iconNow) return;

      const elapsed = Date.now() - parseInt(iconNow.dataset.startTime);
      const remaining = duration - elapsed;
      
      if (remaining <= 0) {
        this.remove(type);
      } else {
        // Обновляем визуальный таймер (круговой прогресс)
        const percent = (remaining / duration) * 100;
        iconNow.style.setProperty('--timer-percent', percent);
        requestAnimationFrame(updateTimer);
      }
    };
    
    requestAnimationFrame(updateTimer);
  }
}

export default PowerUpIcons;
