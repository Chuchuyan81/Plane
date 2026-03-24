// src/ui/screens/PauseMenu.js

class PauseMenu {
  constructor() {
    this.container = document.getElementById('pauseMenu');
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
      this.container.classList.add('active');
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.container.classList.remove('active');
    }
  }
}

export default PauseMenu;
