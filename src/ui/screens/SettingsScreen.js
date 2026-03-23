import { GAME_CONSTANTS } from '../../utils/constants.js';
import { storage } from '../../utils/storage.js';

/**
 * Экран настроек сложности
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
                background: rgba(0, 0, 0, 0.9);
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 50;
            }
            .settings-title {
                font-size: 32px;
                color: gold;
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .difficulty-selector {
                display: flex;
                flex-direction: column;
                gap: 15px;
                width: 80%;
                max-width: 300px;
            }
            .difficulty-btn {
                padding: 15px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 18px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: center;
            }
            .difficulty-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            .difficulty-btn.active {
                border-color: gold;
                background: rgba(255, 215, 0, 0.2);
                color: gold;
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            }
            .difficulty-desc {
                font-size: 12px;
                margin-top: 5px;
                opacity: 0.7;
            }
            .back-btn {
                margin-top: 40px;
                padding: 10px 30px;
                border: none;
                background: #ff4757;
                color: white;
                border-radius: 20px;
                font-size: 16px;
                cursor: pointer;
                min-width: 150px;
            }
        `;
        document.head.appendChild(style);
    }

    _initElements() {
        this.container.innerHTML = `
            <div class="settings-title">НАСТРОЙКИ</div>
            <div class="difficulty-selector">
                <div class="difficulty-btn" data-level="easy">
                    ЛЕГКО
                    <div class="difficulty-desc">Чек-поинты: 300м | Скорость: 0.8x</div>
                </div>
                <div class="difficulty-btn" data-level="medium">
                    СРЕДНЕ
                    <div class="difficulty-desc">Чек-поинты: 500м | Скорость: 1.0x</div>
                </div>
                <div class="difficulty-btn" data-level="hard">
                    СЛОЖНО
                    <div class="difficulty-desc">Чек-поинты: 750м | Скорость: 1.3x</div>
                </div>
            </div>
            <button class="back-btn">НАЗАД</button>
        `;
        
        this.diffButtons = this.container.querySelectorAll('.difficulty-btn');
        this.backBtn = this.container.querySelector('.back-btn');
        
        this._setupEvents();
        this._loadCurrentDifficulty();
    }

    _setupEvents() {
        this.diffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;
                this.setDifficulty(level);
            });
        });
        
        this.backBtn.addEventListener('click', () => {
            this.hide();
            // Возвращаемся в главное меню (или в то меню, откуда пришли)
            // Логика перехода будет управляться извне
            if (this.onBack) this.onBack();
        });
    }

    _loadCurrentDifficulty() {
        const current = storage.getDifficulty();
        this._updateButtonStyles(current);
    }

    _updateButtonStyles(level) {
        this.diffButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });
    }

    setDifficulty(level) {
        storage.setDifficulty(level);
        this._updateButtonStyles(level);
        if (this.onDifficultyChange) this.onDifficultyChange(level);
    }

    show(onBackCallback) {
        this.onBack = onBackCallback;
        this.container.classList.remove('hidden');
        this.container.classList.add('active');
        this._loadCurrentDifficulty();
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.classList.remove('active');
    }

    mount(parent) {
        parent.appendChild(this.container);
    }
}
