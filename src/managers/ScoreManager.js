import { storage } from '../utils/storage.js';
import { BossConfig } from '../config/BossConfig.js';

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
        window.dispatchEvent(new CustomEvent('score-updated', { detail: { score: 0, added: 0 } }));
    }

    /**
     * Загрузка данных из чек-поинта
     * @param {object} checkpoint - объект чек-поинта
     * @param {string} difficulty - сложность
     */
    loadFromCheckpoint(checkpoint, difficulty = 'medium') {
        if (!checkpoint) return;
        this.score = checkpoint.score;
        
        // ТЗ 1.1 §5: Easy — комбо до 1; Medium — до 0 (игровой минимум x1); Hard — +10% штраф к очкам
        if (checkpoint.type === 'PRE_BOSS' || checkpoint.type === 'MID_BOSS') {
            if (difficulty === 'easy') {
                this.combo = 1.0;
            } else if (difficulty === 'medium') {
                this.combo = 1.0;
            } else {
                this.combo = 1.0;
                this.score = Math.floor(this.score * 0.9);
            }
        } else {
            this.combo = 1.0;
        }
        window.dispatchEvent(new CustomEvent('score-updated', { detail: { score: this.score, added: 0 } }));
    }

    /**
     * Базовые очки за тип врага с учётом сложности (ТЗ 1.1)
     * @param {'drone'|'kamikaze'|'shooter'} enemyType
     * @param {string} difficulty - easy | medium | hard
     */
    getEnemyKillPoints(enemyType, difficulty = 'medium') {
        const base = BossConfig.ENEMY_SCORE[enemyType] ?? 150;
        const mult = BossConfig.ENEMY_SCORE_DIFFICULTY_MULT[difficulty] ?? 1.0;
        return Math.floor(base * mult);
    }

    /**
     * Бонус за победу над боссом (без комбо-множителя счёта — начисляется целиком)
     * @param {number} combo - текущее комбо
     * @param {boolean} noDamage - игрок не получал урон в бою
     */
    addBossDefeatBonus(combo, noDamage) {
        const { BASE, COMBO_MULTIPLIER, NO_DAMAGE } = BossConfig.BOSS_BONUS;
        const noDamageMult = noDamage ? NO_DAMAGE : 1.0;
        const raw = (BASE + combo * COMBO_MULTIPLIER) * noDamageMult;
        const bonus = Math.floor(raw);
        this.score += bonus;
        window.dispatchEvent(new CustomEvent('score-updated', { detail: { score: this.score, added: bonus } }));
        console.log(`[ScoreManager] Boss defeat bonus: ${bonus} (combo=${combo}, noDamage=${noDamage})`);
        return bonus;
    }

    /**
     * Добавление очков
     * @param {number} points - количество очков (без учёта комбо)
     */
    addScore(points) {
        const added = Math.floor(points * this.combo);
        this.score += added;
        window.dispatchEvent(new CustomEvent('score-updated', { detail: { score: this.score, added } }));
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
