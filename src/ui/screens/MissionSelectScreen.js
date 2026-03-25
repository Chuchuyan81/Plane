// src/ui/screens/MissionSelectScreen.js

class MissionSelectScreen {
  constructor() {
    this.container = document.getElementById('missionSelectScreen');
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

export default MissionSelectScreen;
