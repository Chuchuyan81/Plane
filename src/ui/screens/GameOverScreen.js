// src/ui/screens/GameOverScreen.js

class GameOverScreen {
  constructor() {
    this.container = document.getElementById('gameOverScreen');
    this.finalScore = document.getElementById('finalScore');
    this.finalDistance = document.getElementById('finalDistance');
  }

  show(score, distance) {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.classList.add('active');
      
      if (this.finalScore) this.finalScore.textContent = score.toLocaleString('ru-RU');
      if (this.finalDistance) this.finalDistance.textContent = `${Math.floor(distance)} м`;
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.container.classList.remove('active');
    }
  }
}

export default GameOverScreen;
