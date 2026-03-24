// src/ui/screens/PauseMenu.js

class PauseMenu {
  constructor() {
    this.container = document.getElementById('pauseMenu');
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
}

export default PauseMenu;
