import { GAME_CONSTANTS } from '../../utils/constants.js';
import { storage } from '../../utils/storage.js';

/**
 * Экран настроек
 */
export class SettingsScreen {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'settings-screen';
        this.container.className = 'menu-screen hidden';
        this._initStyles();
        this._initElements();
    }

    _initStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #settings-screen {
                background: rgba(0, 0, 0, 0.95);
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                z-index: 100;
                padding-top: 50px;
                overflow-y: auto;
            }
            .settings-title {
                font-size: 32px;
                color: gold;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .settings-section {
                width: 90%;
                max-width: 400px;
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 18px;
                color: #ccc;
                margin-bottom: 10px;
                text-align: left;
                width: 100%;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 5px;
            }
            .selector-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .selector-btn {
                padding: 12px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.05);
                color: white;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                position: relative;
            }
            .selector-btn:active { transform: scale(0.98); }
            .selector-btn.active {
                border-color: gold;
                background: rgba(255, 215, 0, 0.15);
                color: gold;
            }
            .btn-desc {
                font-size: 11px;
                margin-top: 4px;
                opacity: 0.6;
            }
            .back-btn {
                margin: 20px 0 50px 0;
                padding: 15px 40px;
                border: none;
                background: #ff4757;
                color: white;
                border-radius: 30px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                min-width: 200px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    _initElements() {
        this.container.innerHTML = `
            <div class="settings-title">НАСТРОЙКИ</div>
            
            <div class="settings-section">
                <div class="section-title">ЗВУК</div>
                <div class="selector-group sound-selector">
                    <div class="selector-btn" data-sound="true">ВКЛЮЧЕН</div>
                    <div class="selector-btn" data-sound="false">ВЫКЛЮЧЕН</div>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-title">СЛОЖНОСТЬ</div>
                <div class="selector-group difficulty-selector">
                    <div class="selector-btn" data-level="easy">
                        ЛЕГКО
                        <div class="btn-desc">Чек-поинты: 500м | Без штрафов</div>
                    </div>
                    <div class="selector-btn" data-level="medium">
                        СРЕДНЕ
                        <div class="btn-desc">Чек-поинты: 750м | Сброс комбо</div>
                    </div>
                    <div class="selector-btn" data-level="hard">
                        СЛОЖНО
                        <div class="btn-desc">Чек-поинты: 1000м | Потеря бонусов</div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-title">ДЕТАЛИЗАЦИЯ ТРАССЫ</div>
                <div class="selector-group detail-selector">
                    <div class="selector-btn" data-detail="low">
                        НИЗКАЯ
                        <div class="btn-desc">Только чек-поинты</div>
                    </div>
                    <div class="selector-btn" data-detail="medium">
                        СРЕДНЯЯ
                        <div class="btn-desc">Маркеры через 500м</div>
                    </div>
                    <div class="selector-btn" data-detail="high">
                        ВЫСОКАЯ
                        <div class="btn-desc">Маркеры через 100м</div>
                    </div>
                </div>
            </div>

            <button class="back-btn">НАЗАД</button>
        `;
        
        this.diffButtons = this.container.querySelectorAll('.difficulty-selector .selector-btn');
        this.soundButtons = this.container.querySelectorAll('.sound-selector .selector-btn');
        this.detailButtons = this.container.querySelectorAll('.detail-selector .selector-btn');
        this.backBtn = this.container.querySelector('.back-btn');
        
        this._setupEvents();
    }

    _setupEvents() {
        this.diffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;
                this.setDifficulty(level);
            });
        });

        this.soundButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const enabled = btn.dataset.sound === 'true';
                this.setSoundEnabled(enabled);
            });
        });

        this.detailButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const detail = btn.dataset.detail;
                this.setMarkerDetail(detail);
            });
        });
        
        this.backBtn.addEventListener('click', () => {
            this.hide();
            if (this.onBack) this.onBack();
        });
    }

    _loadSettings() {
        const diff = storage.getDifficulty();
        const sound = storage.getSoundEnabled();
        const detail = storage.getMarkerDetail();
        
        this.diffButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === diff);
        });

        this.soundButtons.forEach(btn => {
            btn.classList.toggle('active', (btn.dataset.sound === 'true') === sound);
        });

        this.detailButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.detail === detail);
        });
    }

    setDifficulty(level) {
        storage.setDifficulty(level);
        this._loadSettings();
        if (this.onDifficultyChange) this.onDifficultyChange(level);
    }

    setSoundEnabled(enabled) {
        storage.setSoundEnabled(enabled);
        this._loadSettings();
        if (this.onSoundChange) this.onSoundChange(enabled);
    }

    setMarkerDetail(detail) {
        storage.setMarkerDetail(detail);
        this._loadSettings();
        if (this.onDetailChange) this.onDetailChange(detail);
    }

    show(onBackCallback) {
        this.onBack = onBackCallback;
        this.container.classList.remove('hidden');
        this.container.classList.add('active');
        this._loadSettings();
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.classList.remove('active');
    }

    mount(parent) {
        parent.appendChild(this.container);
    }
}
