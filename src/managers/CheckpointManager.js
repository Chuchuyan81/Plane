import { GAME_CONSTANTS } from '../utils/constants.js';

export class CheckpointManager {
    constructor() {
        this.checkpoints = [];
        this.lastCheckpoint = null;
        this.interval = GAME_CONSTANTS.CHECKPOINT_INTERVALS.medium;
        this.currentDifficulty = 'medium';
        this.lastSavedDistance = 0;
        this.isLocked = false;
    }

    /**
     * Инициализация с учётом сложности
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     */
    init(difficulty) {
        this.currentDifficulty = difficulty;
        this.interval = GAME_CONSTANTS.CHECKPOINT_INTERVALS[difficulty] || 500;
        this.isLocked = false;
        this.reset();
    }

    /**
     * Блокировка создания чек-поинтов
     */
    lockCheckpointCreation() {
        this.isLocked = true;
    }

    /**
     * Разблокировка создания чек-поинтов
     */
    unlockCheckpointCreation() {
        this.isLocked = false;
    }

    /**
     * Принудительное сохранение (например, для PRE_BOSS)
     * @param {object} metadata - дополнительные данные для чек-поинта
     * @returns {object} сохранённый чек-поинт
     */
    forceSave(metadata = {}) {
        const checkpoint = {
            distance: metadata.distance !== undefined ? metadata.distance : this.lastSavedDistance,
            score: metadata.score !== undefined ? metadata.score : 0,
            comboMultiplier: metadata.combo !== undefined ? metadata.combo : 1,
            activePowerUps: Array.isArray(metadata.activePowerUps) ? metadata.activePowerUps : [],
            type: metadata.type || 'STANDARD',
            timestamp: Date.now(),
            ...metadata
        };

        this.lastCheckpoint = checkpoint;
        this.checkpoints.push(checkpoint);
        return checkpoint;
    }

    /**
     * Проверка достижения чек-поинта
     * @param {number} distance - текущая дистанция
     * @returns {boolean} сохранён ли чек-поинт
     */
    check(distance) {
        if (this.isLocked) return false;

        // Проверяем достижение нового интервала (например, каждые 500 м)
        const nextTarget = this.lastSavedDistance + this.interval;
        if (distance >= nextTarget) {
            this.lastSavedDistance = Math.floor(distance / this.interval) * this.interval;
            return true;
        }
        return false;
    }

    /**
     * Сохранение текущего состояния
     * @param {object} gameState - объект состояния игры
     * @param {string} type - тип чек-поинта ('STANDARD', 'PRE_BOSS', 'POST_BOSS')
     * @returns {object} сохранённый чек-поинт
     */
    save(gameState, type = 'STANDARD') {
        const checkpoint = {
            distance: this.lastSavedDistance,
            score: gameState.score,
            comboMultiplier: gameState.combo,
            activePowerUps: this._serializePowerUps(gameState.player),
            lastBossScore: gameState.lastBossScore,
            nextBossThreshold: gameState.nextBossThreshold,
            type: type,
            timestamp: Date.now()
        };
        
        this.lastCheckpoint = checkpoint;
        this.checkpoints.push(checkpoint);
        
        return checkpoint;
    }

    /**
     * Получение последнего чек-поинта
     * @returns {object|null}
     */
    getLast() {
        return this.lastCheckpoint;
    }

    /**
     * Сброс всех чек-поинтов
     */
    reset() {
        this.checkpoints = [];
        this.lastCheckpoint = null;
        this.lastSavedDistance = 0;
    }

    /**
     * Расчёт прогресса до следующего чек-поинта
     * @param {number} currentDistance - текущая пройденная дистанция
     * @returns {object} { current, next, percent }
     */
    getProgress(currentDistance) {
        const currentInInterval = currentDistance - this.lastSavedDistance;
        const percent = Math.min(100, (currentInInterval / this.interval) * 100);
        
        return {
            current: Math.floor(currentInInterval),
            next: this.interval,
            percent: Math.round(percent)
        };
    }

    /**
     * Сериализация активных бонусов игрока (публично для MID_BOSS и т.п.)
     * @param {object} player - объект игрока (mesh + поля бонусов)
     */
    serializeActivePowerUps(player) {
        return this._serializePowerUps(player);
    }

    /**
     * Сериализация активных бонусов игрока
     * @private
     */
    _serializePowerUps(player) {
        const powerups = [];
        if (player.shield > 0) powerups.push({ type: 'shield', value: player.shield });
        if (player.speedBoost > 0) powerups.push({ type: 'speed', value: player.speedBoost });
        if (player.multiShot > 0) powerups.push({ type: 'multishot', value: player.multiShot });
        return powerups;
    }
}

export const checkpointManager = new CheckpointManager();
