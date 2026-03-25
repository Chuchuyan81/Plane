// src/ui/screens/HangarScreen.js

class HangarScreen {
  constructor() {
    this.container = document.getElementById('hangarScreen');
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

export default HangarScreen;
