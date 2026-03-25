import { GameState } from './GameState.js';

/**
 * Обработка пользовательского ввода
 */
export class InputHandler {
    constructor() {
        this.input = { x: 0, y: 0, intensity: 0 };
        this.keys = {};
        this.joyBase = document.getElementById('joystick-base');
        this.joyStick = document.getElementById('joystick-stick');
        this.joyRadius = 50;
        this.startPos = { x: 0, y: 0 };
        this.isJoystickActive = false;
        
        this._setupEvents();
    }

    _setupEvents() {
        // Тач-события
        window.addEventListener('touchstart', e => {
            if (e.target.closest('.screen')) return;
            this._handleInputStart(e.touches[0].clientX, e.touches[0].clientY);
        }, {passive:false});
        
        window.addEventListener('touchmove', e => { 
            if (this.isJoystickActive) {
                e.preventDefault(); 
                this._handleInputMove(e.touches[0].clientX, e.touches[0].clientY); 
            }
        }, {passive:false});
        
        window.addEventListener('touchend', () => this._handleInputEnd());

        // Мышь
        window.addEventListener('mousedown', e => {
            if (e.target.closest('.screen')) return;
            this._handleInputStart(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', e => { 
            if(this.isJoystickActive) {
                e.preventDefault();
                this._handleInputMove(e.clientX, e.clientY); 
            }
        }, {passive:false});
        window.addEventListener('mouseup', () => this._handleInputEnd());

        // Клавиатура
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    }

    _handleInputStart(x, y) {
        if (this.onStart) this.onStart();
        this.startPos = { x, y };
        this.isJoystickActive = true;
        this.joyBase.style.display = 'block';
        this.joyBase.style.left = (x - this.joyRadius) + 'px';
        this.joyBase.style.top = (y - this.joyRadius) + 'px';
    }

    _handleInputMove(x, y) {
        if (!this.isJoystickActive) return;
        
        const dx = x - this.startPos.x;
        const dy = y - this.startPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        
        const moveDist = Math.min(dist, this.joyRadius);
        this.input.intensity = moveDist / this.joyRadius;
        this.input.x = (moveDist * Math.cos(angle)) / this.joyRadius;
        this.input.y = (moveDist * Math.sin(angle)) / this.joyRadius;

        this.joyStick.style.left = (25 + this.input.x * this.joyRadius/2) + 'px';
        this.joyStick.style.top = (25 + this.input.y * this.joyRadius/2) + 'px';
    }

    _handleInputEnd() {
        this.isJoystickActive = false;
        this.joyBase.style.display = 'none';
        this.input.x = 0; 
        this.input.y = 0; 
        this.input.intensity = 0;
    }

    /**
     * Получить текущий ввод
     * @returns {object} { x, y }
     */
    getInput() {
        let kX = 0, kY = 0;
        if (this.keys['ArrowLeft']) kX = -1;
        if (this.keys['ArrowRight']) kX = 1;
        if (this.keys['ArrowUp']) kY = -1;
        if (this.keys['ArrowDown']) kY = 1;

        return {
            x: this.input.x || kX,
            y: -(this.input.y || kY) // Инвертируем Y для Three.js
        };
    }

    /**
     * Скрыть джойстик (принудительно)
     */
    hideJoystick() {
        this._handleInputEnd();
    }
}

export const inputHandler = new InputHandler();
