import { notificationSystem } from '../ui/components/Notification.js';
import { CheckpointBar } from '../ui/components/CheckpointBar.js';
import { SettingsScreen } from '../ui/screens/SettingsScreen.js';
import { BossHUD } from '../ui/BossHUD.js';

/**
 * Управление пользовательским интерфейсом
 */
export class UIManager {
    constructor() {
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            gameHud: document.getElementById('game-hud'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over')
        };
        
        this.hudElements = {
            score: document.getElementById('hud-score'),
            distance: document.getElementById('hud-distance'),
            combo: document.getElementById('hud-combo'),
            comboContainer: document.getElementById('combo-container'),
            bossHpContainer: document.getElementById('boss-hp-container'),
            bossHpBar: document.getElementById('boss-hp-bar'),
            powerupsHud: document.getElementById('powerups-hud'),
            bossWarning: document.getElementById('boss-warning')
        };
        
        this.checkpointBar = new CheckpointBar();
        this.settingsScreen = new SettingsScreen();
        this.notificationSystem = notificationSystem;
        this.bossHUD = new BossHUD();
        
        this._init();
    }

    _init() {
        // Монтируем новые компоненты
        const barMount = document.getElementById('checkpoint-bar-mount');
        if (barMount) this.checkpointBar.mount(barMount);
        
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) this.settingsScreen.mount(uiLayer);
    }

    /**
     * Показать экран
     * @param {string} screenKey - mainMenu | gameHud | pauseMenu | gameOver
     */
    showScreen(screenKey) {
        Object.values(this.screens).forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        
        const target = this.screens[screenKey];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    }

    /**
     * Обновить HUD
     * @param {object} data - { score, distance, combo, comboActive, bossHp, bossCurrentHp, bossMaxHp, bossName }
     */
    updateHUD(data) {
        if (data.score !== undefined) this.hudElements.score.innerText = data.score;
        if (data.distance !== undefined) this.hudElements.distance.innerText = Math.round(data.distance);
        if (data.combo !== undefined) this.hudElements.combo.innerText = data.combo.toFixed(1);
        
        if (data.comboActive) {
            this.hudElements.comboContainer.classList.add('combo-active');
            setTimeout(() => this.hudElements.comboContainer.classList.remove('combo-active'), 100);
        }
        
        if (data.bossHp !== undefined) {
            if (data.bossHp > 0) {
                if (!this.bossHUD.isVisible) {
                    this.bossHUD.show(data.bossName || "BOSS", data.bossMaxHp || 100);
                }
                this.bossHUD.update(data.bossHp, data.bossCurrentHp || 0, data.bossMaxHp || 0);
            } else {
                this.bossHUD.hide();
            }
        }
    }

    /**
     * Показать/скрыть предупреждение о боссе
     */
    setBossWarning(visible) {
        this.hudElements.bossWarning.style.display = visible ? 'block' : 'none';
    }

    /**
     * Показать уведомление
     */
    notify(text, type, duration) {
        this.notificationSystem.show(text, type, duration);
    }

    /**
     * Обновить полосу прогресса чек-поинта
     */
    updateCheckpointProgress(progress) {
        this.checkpointBar.update(progress);
    }

    /**
     * Скрыть/показать полосу чек-поинта
     */
    setCheckpointBarVisible(visible) {
        if (visible) this.checkpointBar.show();
        else this.checkpointBar.hide();
    }
}

export const uiManager = new UIManager();
