/**
 * Конфигурация босс-системы и наград (ТЗ 1.1)
 * Основано на техническом задании SKY ACE 3D.
 */

export const BossConfig = {
    /** Базовый порог очков для первого босса */
    baseScoreThreshold: 5000,

    /** Множитель увеличения порога после каждого босса */
    thresholdGrowthMultiplier: 1.5,

    /**
     * Очки, которые нужно набрать после предыдущего босса (или с нуля до первого).
     * bossesKilled — сколько боссов уже побеждено ПОСЛЕ инкремента (для следующего интервала).
     * Пример: 0 → 5000 до босса 1; после 1-го босса k=1 → +7500 до босса 2.
     */
    calculateNextThreshold: (bossesKilled) => {
        return Math.floor(
            BossConfig.baseScoreThreshold *
            Math.pow(BossConfig.thresholdGrowthMultiplier, bossesKilled)
        );
    },

    /** Порог предупреждения (за сколько очков до босса показывать) */
    WARNING_THRESHOLD: 500,

    /**
     * Полоса «до босса» и предупреждение только после этой доли пройденного интервала (lastBossScore→threshold).
     * Исключает ложные срабатывания при малом пороге миссии и в начале забега.
     */
    BOSS_PROGRESS_BAR_FROM: 0.78,

    /** Настройки спавна бонусов во время боя с боссом */
    BOSS_BONUS_SPAWN_INTERVAL: 5000, // 5 секунд (было 8)
    MAX_ACTIVE_BOSS_BONUSES: 3, // Было 2

    HP_MULTIPLIER: {
        easy: 0.6, // Было 0.8
        medium: 1.0, // Было 1.2
        hard: 1.5 // Было 1.8
    },

    /** Базовое HP босса до множителя сложности */
    BOSS_BASE_HP: 30, // Было 40
    BOSS_HP_PER_KILL: 30, // Было 40

    RESPAWN_ASSIST: {
        easy: 0.25,
        medium: 0.15,
        hard: 0
    },

    /** На Hard при 3+ смертях: скорость пуль босса × (1 - это значение) = 0.9 */
    HARD_BULLET_SLOW_ASSIST: 0.1,

    ENEMY_SCORE: {
        drone: 150,
        kamikaze: 300,
        shooter: 400
    },

    /** Множитель базовой награды за врагов по сложности (ТЗ §5) */
    ENEMY_SCORE_DIFFICULTY_MULT: {
        easy: 1.5,
        medium: 1.2,
        hard: 1.0
    },

    BOSS_BONUS: {
        BASE: 5000,
        COMBO_MULTIPLIER: 100,
        NO_DAMAGE: 1.5
    },

    /** Прелоад лог при заполнении прогресс-бара (доля от порога) */
    PRELOAD_PROGRESS: 0.8,

    PLAYER: {
        MAX_HP: 100,
        BULLET_DAMAGE: 1,
        FIRE_INTERVAL: 0.15,
        COLLISION_DAMAGE: {
            bullet: 20,
            enemy: 50,
            boss: 100
        }
    },

    POWERUPS: {
        REPAIR_AMOUNT: 30,
        DAMAGE_BOOST: 1, // Дополнительный урон
        FIRE_RATE_BOOST: 0.05, // Уменьшение интервала
        DURATION: 10 // Длительность временных бонусов (сек)
    }
};
