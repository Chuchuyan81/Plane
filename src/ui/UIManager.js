// src/ui/UIManager.js

import MainMenu from './screens/MainMenu.js';
import PauseMenu from './screens/PauseMenu.js';
import GameOverScreen from './screens/GameOverScreen.js';
import SettingsScreen from './screens/SettingsScreen.js';
import HealthBar from './components/HealthBar.js';
import ComboDisplay from './components/ComboDisplay.js';
import PowerUpIcons from './components/PowerUpIcons.js';
import Notification from './components/Notification.js';
import BossProgress from './components/BossProgress.js';
import BossHUD from './components/BossHUD.js';
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
    this.components.combo = new ComboDisplay();
    this.components.powerUps = new PowerUpIcons();
    this.components.notifications = new Notification();
    this.components.bossProgress = new BossProgress();
    this.components.bossHUD = new BossHUD();
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
        break;
      case GameState.RESPAWNING:
        this.showHUD();
        break;
      case GameState.MISSION_COMPLETE:
        this.hideHUD();
        this.hideAllScreens();
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
        
        // Use new BossHUD if data is available
        if (data.bossName && data.bossPhase) {
          this.updateBossHUD(data.bossName, currentHp, data.bossMaxHp || 100, data.bossPhase, true);
        }
      } else {
        this.updateBossHUD('', 0, 1, 'PHASE_1', false);
      }
    }

    if (data.bossProgress !== undefined && data.bossThreshold !== undefined) {
      const baseline = data.bossProgressBaseline !== undefined ? data.bossProgressBaseline : 0;
      const showProgress = data.showBossProgressBar === true;
      this.updateBossProgress(data.bossProgress, data.bossThreshold, showProgress, baseline);
    }
  }

  /** Сброс всех индикаторов боя с боссом (старт миссии / меню) */
  clearBossBattleUI() {
    if (this.components.notifications) {
      this.components.notifications.clearAll();
    }
    this.setBossWarning(false);
    this.updateBossHUD('', 0, 1, 'PHASE_1', false);
    this.updateBossProgress(0, 1, false, 0);
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

  /**
   * Флаг предупреждения для HUD (полоса «до босса»). Без тоста: в разметке нет #boss-warning,
   * а всплывающее «ВНИМАНИЕ: БОСС!» давало ложные срабатывания между миссиями.
   */
  setBossWarning(visible) {
    const warning = document.getElementById('boss-warning');
    if (warning) {
      warning.style.display = visible ? 'block' : 'none';
    }
  }

  updateBossProgress(currentScore, bossThreshold, visible = true, baseline = 0) {
    if (this.components.bossProgress) {
      if (visible) {
        this.components.bossProgress.show();
        this.components.bossProgress.update(currentScore, bossThreshold, baseline);
      } else {
        this.components.bossProgress.hide();
      }
    }
  }

  updateBossHUD(bossName, hp, maxHP, phase, visible = true) {
    if (this.components.bossHUD) {
      if (visible) {
        this.components.bossHUD.show(bossName, hp, maxHP, phase);
      } else {
        this.components.bossHUD.hide();
      }
    }
  }

  resetBossProgress() {
    this.updateBossProgress(0, 1, false, 0);
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
