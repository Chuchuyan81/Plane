import { GAME_CONSTANTS } from '../utils/constants.js';

/**
 * Логика физики и расчёта дистанции
 */
export class PhysicsEngine {
    constructor() {
        this.distance = 0;
        this.difficulty = 1.0;
        this.speedModifiers = GAME_CONSTANTS.OBSTACLE_SPEED_MODIFIERS;
        this.spawnModifiers = GAME_CONSTANTS.ENEMY_SPAWN_MODIFIERS;
        /** Заморозка прогресса дистанции (бой с боссом) */
        this._distanceProgressFrozen = false;
        this._frozenDistance = 0;
    }

    /**
     * Заморозить прогресс дистанции (во время BOSS_FIGHT)
     */
    freezeDistanceProgress() {
        this._distanceProgressFrozen = true;
        this._frozenDistance = this.distance;
        console.log('[Physics] Distance progress frozen at', this._frozenDistance);
    }

    /**
     * Возобновить обновление дистанции по позиции игрока
     */
    resumeDistanceProgress() {
        this._distanceProgressFrozen = false;
        console.log('[Physics] Distance progress resumed');
    }

    /**
     * Обновление пройденной дистанции
     * @param {THREE.Vector3} playerPosition - позиция игрока
     */
    updateDistance(playerPosition) {
        if (this._distanceProgressFrozen) {
            return this._frozenDistance;
        }
        // Пройденная дистанция в этой игре — это перемещение игрока по отрицательной оси Z
        this.distance = Math.floor(Math.max(0, -playerPosition.z));
        return this.distance;
    }

    /**
     * Получение текущей дистанции
     */
    getDistance() {
        return this.distance;
    }

    /**
     * Сброс дистанции
     * @param {number} value - начальное значение (например, из чек-поинта)
     */
    resetDistance(value = 0) {
        this.distance = value;
        this._frozenDistance = value;
        this._distanceProgressFrozen = false;
    }

    /**
     * Расчёт параметров сложности на основе выбранного уровня
     * @param {string} level - 'easy' | 'medium' | 'hard'
     */
    getDifficultyModifiers(level) {
        return {
            speed: this.speedModifiers[level] || 1.0,
            spawn: this.spawnModifiers[level] || 1.0
        };
    }
}

export const physics = new PhysicsEngine();
