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
    }

    /**
     * Обновление пройденной дистанции
     * @param {THREE.Vector3} playerPosition - позиция игрока
     */
    updateDistance(playerPosition) {
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
