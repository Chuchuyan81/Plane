// src/ui/screens/SettingsScreen.js

import { storage } from '../../utils/storage.js';

class SettingsScreen {
  constructor() {
    this.container = document.getElementById('settingsScreen');
    this.difficultySelect = document.getElementById('settingDifficulty');
    this.backButton = document.getElementById('btnSettingsBack');
    this.soundToggle = document.getElementById('btnSoundToggle');
    this.onDifficultyChange = null;
  }

  syncSoundToggle() {
    if (!this.soundToggle) return;
    const on = storage.getSoundEnabled();
    this.soundToggle.textContent = on ? 'ВКЛ' : 'ВЫКЛ';
    this.soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  show(onBack) {
    if (this.container) {
      this.container.style.display = 'flex';
      this.container.classList.add('active');
      this.syncSoundToggle();
      
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
