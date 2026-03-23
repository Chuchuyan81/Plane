import { storage } from '../utils/storage.js';

/**
 * Управление счётом и комбо
 */
export class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.kills = 0;
        this.bossesKilled = 0;
        this.bestScore = storage.getBestScore();
    }

    /**
     * Сброс всех значений
     */
    reset() {
        this.score = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.kills = 0;
        this.bossesKilled = 0;
        this.bestScore = storage.getBestScore();
    }

    /**
     * Загрузка данных из чек-поинта
     * @param {object} checkpoint - объект чек-поинта
     */
    loadFromCheckpoint(checkpoint) {
        if (!checkpoint) return;
        this.score = checkpoint.score;
        this.combo = 1; // По ТЗ: Сброс множителя комбо в 1.0 при возрождении
    }

    /**
     * Добавление очков
     * @param {number} points - количество очков (без учёта комбо)
     */
    addScore(points) {
        this.score += Math.floor(points * this.combo);
        return this.score;
    }

    /**
     * Обновление комбо
     * @param {boolean} isHit - попадание по врагу
     */
    updateCombo(isHit) {
        if (isHit) {
            this.combo = Math.min(10, this.combo + 0.1);
            this.maxCombo = Math.max(this.maxCombo, Math.floor(this.combo));
        } else {
            this.combo = 1;
        }
        return this.combo;
    }

    /**
     * Увеличение счётчика убийств
     */
    addKill() {
        this.kills++;
    }

    /**
     * Увеличение счётчика убитых боссов
     */
    addBossKill() {
        this.bossesKilled++;
    }

    /**
     * Сохранение лучших результатов
     */
    saveStats() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            storage.setBestScore(this.bestScore);
            return true; // Новый рекорд
        }
        
        // Сохранение общих счётчиков
        const totalKills = storage.getTotalKills() + this.kills;
        const totalBosses = storage.getTotalBosses() + this.bossesKilled;
        storage.setTotalKills(totalKills);
        storage.setTotalBosses(totalBosses);
        
        return false;
    }

    /**
     * Получение текущего состояния
     */
    getState() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            kills: this.kills,
            bossesKilled: this.bossesKilled,
            bestScore: this.bestScore
        };
    }
}

export const scoreManager = new ScoreManager();
