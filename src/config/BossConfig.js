/**
 * Конфигурация босс-системы и наград (ТЗ 1.1)
 * Основано на техническом задании SKY ACE 3D.
 */

export const BossConfig = {
    SCORE_THRESHOLD: {
        easy: 3000,
        medium: 6000,
        hard: 9000
    },

    HP_MULTIPLIER: {
        easy: 1.0,
        medium: 1.5,
        hard: 2.2
    },

    /** Базовое HP босса до множителя сложности */
    BOSS_BASE_HP: 100,
    BOSS_HP_PER_KILL: 50,

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
    PRELOAD_PROGRESS: 0.8
};
