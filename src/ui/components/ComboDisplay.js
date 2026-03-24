// src/ui/components/ComboDisplay.js

class ComboDisplay {
  constructor() {
    this.container = document.getElementById('comboContainer');
    this.text = document.getElementById('comboText');
    this.arrows = document.getElementById('comboArrows');
    this.currentCombo = 1.0;
    this.previousCombo = 1.0;
  }

  update(combo) {
    this.currentCombo = combo;
    if (this.text) this.text.textContent = `COMBO x${combo.toFixed(1)}`;
    
    // Стрелки показывают рост
    const arrowCount = Math.min(Math.floor(combo), 5);
    if (this.arrows) this.arrows.textContent = '▲'.repeat(arrowCount);
    
    // Цвет в зависимости от множителя
    if (this.container) {
      this.container.className = 'combo-display';
      if (combo >= 5.0) {
        this.container.classList.add('high');
      } else if (combo >= 2.0) {
        this.container.classList.add('medium');
      }
      
      // Анимация при увеличении
      if (combo > this.previousCombo) {
        this.pulse();
      }
    }
    this.previousCombo = combo;
  }

  pulse() {
    if (this.container) {
      this.container.classList.add('pulse');
      setTimeout(() => this.container.classList.remove('pulse'), 200);
    }
  }

  reset() {
    this.update(1.0);
  }
}

export default ComboDisplay;
