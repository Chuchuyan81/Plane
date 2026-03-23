// Константы игры
export const GAME_CONSTANTS = {
    DIFFICULTY_LEVELS: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    },
    CHECKPOINT_INTERVALS: {
        easy: 500,
        medium: 750,
        hard: 1000
    },
    MARKER_DETAIL_LEVELS: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high'
    },
    OBSTACLE_SPEED_MODIFIERS: {
        easy: 0.8,
        medium: 1.0,
        hard: 1.3
    },
    ENEMY_SPAWN_MODIFIERS: {
        easy: 0.7,
        medium: 1.0,
        hard: 1.5
    },
    RESPAWN_ANIMATION_DURATION: 1500, // мс
    SAVE_NOTIFICATION_DURATION: 2000, // мс
    LIMIT_X: 30,
    CEILING: 60,
    FLOOR: 0
};

export const STORAGE_KEYS = {
    DIFFICULTY: 'skyAce_difficulty',
    SOUND_ENABLED: 'skyAce_soundEnabled',
    MARKER_DETAIL: 'skyAce_markerDetail',
    BEST_SCORE: 'skyAce_bestScore',
    TOTAL_KILLS: 'skyAce_totalKills',
    TOTAL_BOSSES: 'skyAce_totalBosses'
};
