/**
 * Компонент полосы прогресса чек-поинта
 */
export class CheckpointBar {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'checkpoint-bar-container';
        this._initStyles();
        this._initElements();
    }

    _initStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #checkpoint-bar-container {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                max-width: 400px;
                background: rgba(0, 0, 0, 0.6);
                padding: 10px;
                border-radius: 10px;
                color: white;
                font-family: Arial, sans-serif;
                pointer-events: none;
                z-index: 100;
                display: flex;
                flex-direction: column;
                align-items: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .checkpoint-label {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .progress-track {
                width: 100%;
                height: 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .progress-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }
            .checkpoint-info {
                width: 100%;
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-top: 5px;
                opacity: 0.8;
            }
            
            /* Адаптация под тач-интерфейс */
            @media (max-width: 600px) {
                #checkpoint-bar-container {
                    bottom: 100px; /* Выше, чтобы не перекрывать джойстик */
                    width: 90%;
                    min-height: 48px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    _initElements() {
        this.container.innerHTML = `
            <div class="checkpoint-label">СЛЕД. ЧЕК-ПОИНТ</div>
            <div class="progress-track">
                <div class="progress-fill" id="checkpoint-fill"></div>
            </div>
            <div class="checkpoint-info">
                <span id="checkpoint-text">0 / 500 м</span>
                <span id="checkpoint-percent">0%</span>
            </div>
        `;
        
        this.fill = this.container.querySelector('#checkpoint-fill');
        this.text = this.container.querySelector('#checkpoint-text');
        this.percent = this.container.querySelector('#checkpoint-percent');
    }

    /**
     * Обновление состояния полосы
     * @param {object} progress - { current, next, percent }
     */
    update(progress) {
        this.fill.style.width = `${progress.percent}%`;
        this.text.innerText = `${progress.current} / ${progress.next} м`;
        this.percent.innerText = `${progress.percent}%`;
    }

    /**
     * Показать полосу
     */
    show() {
        this.container.style.display = 'flex';
    }

    /**
     * Скрыть полосу
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Монтирование в DOM
     * @param {HTMLElement} parent - родительский элемент
     */
    mount(parent) {
        parent.appendChild(this.container);
    }
}
