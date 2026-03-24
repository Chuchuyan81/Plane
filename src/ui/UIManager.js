// src/ui/UIManager.js

import MainMenu from './screens/MainMenu.js';
import PauseMenu from './screens/PauseMenu.js';
import GameOverScreen from './screens/GameOverScreen.js';
import SettingsScreen from './screens/SettingsScreen.js';
import HealthBar from './components/HealthBar.js';
import BossBar from './components/BossBar.js';
import ComboDisplay from './components/ComboDisplay.js';
import PowerUpIcons from './components/PowerUpIcons.js';
import Notification from './components/Notification.js';
import { formatNumber } from './utils/format.js';

class UIManager {
  constructor() {
    this.screens = {};
    this.components = {};
    this.notifications = [];
    this.settings = this.loadSettings();
    this.currentGameState = 'Menu';
  }

  init() {
    this.createScreens();
    this.createComponents();
    this.showScreen('mainMenu');
  }

  createScreens() {
    this.screens.mainMenu = new MainMenu();
    this.screens.pauseMenu = new PauseMenu();
    this.screens.gameOver = new GameOverScreen();
    this.screens.settings = new SettingsScreen();
  }

  createComponents() {
    this.components.healthBar = new HealthBar();
    this.components.bossBar = new BossBar();
    this.components.combo = new ComboDisplay();
    this.components.powerUps = new PowerUpIcons();
    this.components.notifications = new Notification();
  }

  onStateChange(state, GameState) {
    this.currentGameState = state;
    this.hideAllScreens();
    
    switch(state) {
      case GameState.MENU:
        this.showScreen('mainMenu');
        this.hideHUD();
        break;
      case GameState.PLAYING:
        this.showHUD();
        break;
      case GameState.PAUSED:
        this.showScreen('pauseMenu');
        break;
      case GameState.GAMEOVER:
        this.showScreen('gameOver');
        this.hideHUD();
        break;
      case GameState.BOSS_FIGHT:
        this.showHUD();
        this.showBossWarning();
        break;
      case GameState.RESPAWNING:
        this.showHUD();
        break;
    }
  }

  onGameOver(score, distance) {
    this.hideAllScreens();
    if (this.screens.gameOver) {
      this.screens.gameOver.show(score, distance);
    }
    this.hideHUD();
  }

  showScreen(screenName) {
    this.hideAllScreens();
    if (this.screens[screenName]) {
      if (screenName === 'settings') {
        const previousState = this.currentGameState || 'Menu';
        this.screens.settings.show(() => {
          if (previousState === 'Paused') this.showScreen('pauseMenu');
          else this.showScreen('mainMenu');
        });
      } else {
        this.screens[screenName].show();
      }
    }
  }

  hideAllScreens() {
    Object.values(this.screens).forEach(screen => screen.hide());
  }

  showHUD() {
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'block';
  }

  hideHUD() {
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
  }

  // Методы обновления данных
  updateBestScore(score) {
    if (this.screens.mainMenu && typeof this.screens.mainMenu.setBestScore === 'function') {
      this.screens.mainMenu.setBestScore(score);
    }
  }

  updateHUD(data) {
    if (data.score !== undefined) this.updateScore(data.score);
    if (data.distance !== undefined) this.updateDistance(data.distance);
    if (data.combo !== undefined) this.updateCombo(data.combo);
    
    if (data.playerHp !== undefined && data.playerMaxHp !== undefined) {
      this.updateHealth(data.playerHp, data.playerMaxHp);
    }

    if (data.bossHp !== undefined) {
      if (data.bossHp > 0) {
        const currentHp = data.bossCurrentHp !== undefined ? data.bossCurrentHp : (data.bossHp * (data.bossMaxHp || 100));
        this.showBossBar(currentHp, data.bossMaxHp || 100);
      } else {
        this.hideBossBar();
      }
    }
  }

  updateScore(score) {
    const scoreVal = document.getElementById('scoreValue');
    if (scoreVal) scoreVal.textContent = formatNumber(score);
  }

  updateDistance(distance) {
    const distanceVal = document.getElementById('distanceValue');
    if (distanceVal) distanceVal.textContent = `${Math.floor(distance)} м`;
  }

  updateCombo(combo) {
    if (this.components.combo) this.components.combo.update(combo);
  }

  updateHealth(current, max) {
    if (this.components.healthBar) this.components.healthBar.update(current, max);
  }

  showBossBar(hp, max) {
    if (this.components.bossBar) this.components.bossBar.show(hp, max);
  }

  updateBossBar(hp, max = null) {
    if (this.components.bossBar) this.components.bossBar.update(hp, max);
  }

  hideBossBar() {
    if (this.components.bossBar) this.components.bossBar.hide();
  }

  addPowerUp(type, duration) {
    if (this.components.powerUps) this.components.powerUps.add(type, duration);
  }

  removePowerUp(type) {
    if (this.components.powerUps) this.components.powerUps.remove(type);
  }

  showNotification(text, type = 'info', duration = 2000) {
    if (this.components.notifications) this.components.notifications.show(text, type, duration);
  }

  notify(text, type = 'info', duration = 2000) {
    this.showNotification(text, type, duration);
  }

  setBossWarning(visible) {
    if (visible) {
      const warning = document.getElementById('boss-warning');
      if (warning) warning.style.display = 'block';
      else this.showBossWarning();
    } else {
      const warning = document.getElementById('boss-warning');
      if (warning) warning.style.display = 'none';
    }
  }

  showBossWarning() {
    this.showNotification('ВНИМАНИЕ: БОСС!', 'danger', 3000);
  }

  updateBossProgress(currentScore, bossThreshold, visible = true) {
    // Implement if needed
  }

  resetBossProgress() {
    this.updateBossProgress(0, 1, false);
  }

  setCheckpointBarVisible(visible) {
    // Implement if needed
  }

  updateCheckpointProgress(progress) {
    // Implement if needed
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem('skyace3d_settings');
      return settings ? JSON.parse(settings) : {
        difficulty: 'medium',
        sfxVolume: 0.8,
        musicVolume: 0.6,
        vibration: true
      };
    } catch (e) {
      return {
        difficulty: 'medium',
        sfxVolume: 0.8,
        musicVolume: 0.6,
        vibration: true
      };
    }
  }

  saveSettings(settings) {
    localStorage.setItem('skyace3d_settings', JSON.stringify(settings));
    this.settings = settings;
  }
}

export default UIManager;
