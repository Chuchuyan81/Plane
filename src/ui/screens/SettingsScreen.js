// src/ui/screens/SettingsScreen.js

class SettingsScreen {
  constructor() {
    this.container = document.getElementById('settingsScreen');
    this.difficultySelect = document.getElementById('settingDifficulty');
    this.backButton = document.getElementById('btnSettingsBack');
    this.onDifficultyChange = null;
  }

  show(onBack) {
    if (this.container) {
      this.container.style.display = 'flex';
      this.container.classList.add('active');
      
      if (this.backButton) {
        this.backButton.onclick = () => {
          this.hide();
          if (onBack) onBack();
        };
      }
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.container.classList.remove('active');
    }
  }
}

export default SettingsScreen;
