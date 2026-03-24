// src/ui/screens/MainMenu.js

class MainMenu {
  constructor() {
    this.container = document.getElementById('mainMenu');
    this.bestScoreDisplay = document.getElementById('bestScoreValue');
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.classList.add('active');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.container.classList.remove('active');
    }
  }

  setBestScore(score) {
    if (this.bestScoreDisplay) {
      this.bestScoreDisplay.textContent = score.toLocaleString('ru-RU');
    }
  }
}

export default MainMenu;
