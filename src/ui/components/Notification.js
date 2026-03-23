/**
 * Система уведомлений в игре
 */
export class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this._initStyles();
    }

    _initStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #notification-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                pointer-events: none;
                text-align: center;
                width: 100%;
            }
            .notification-msg {
                background: rgba(0, 0, 0, 0.7);
                color: #fff;
                padding: 15px 30px;
                border-radius: 30px;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                border: 2px solid gold;
                animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                display: inline-block;
                margin: 10px;
            }
            .notification-msg.checkpoint {
                border-color: #4CAF50;
                color: #4CAF50;
            }
            .notification-msg.respawn {
                border-color: #2196F3;
                color: #2196F3;
            }
            @keyframes pop-in {
                0% { transform: scale(0.5); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fade-out {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.container);
    }

    /**
     * Показать сообщение
     * @param {string} text - текст сообщения
     * @param {string} type - 'checkpoint' | 'respawn'
     * @param {number} duration - длительность в мс
     */
    show(text, type = 'checkpoint', duration = 2000) {
        const el = document.createElement('div');
        el.className = `notification-msg ${type}`;
        el.innerText = text;
        
        this.container.appendChild(el);
        
        setTimeout(() => {
            el.style.animation = 'fade-out 0.5s forwards';
            setTimeout(() => {
                if (el.parentNode === this.container) {
                    this.container.removeChild(el);
                }
            }, 500);
        }, duration);
    }
}

export const notificationSystem = new NotificationSystem();
