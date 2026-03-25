// Состояния игры
export const GameState = {
    MENU: 'Menu',
    PLAYING: 'Playing',
    PAUSED: 'Paused',
    RESPAWNING: 'Respawning',
    GAMEOVER: 'Game Over',
    BOSS_FIGHT: 'Boss Fight',
    /** Победа в миссии кампании, экран награды */
    MISSION_COMPLETE: 'Mission Complete'
};

export const BossState = {
    ENTERING: 'Entering',
    ACTIVE: 'Active',
    DESTROYED: 'Destroyed',
    LEAVING: 'Leaving'
};
