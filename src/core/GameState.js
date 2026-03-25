// Состояния игры
export const GameState = {
    MENU: 'Menu',
    PLAYING: 'Playing',
    PAUSED: 'Paused',
    RESPAWNING: 'Respawning',
    GAMEOVER: 'Game Over',
    BOSS_FIGHT: 'Boss Fight',
    /** Победа в миссии кампании, экран награды */
    MISSION_COMPLETE: 'Mission Complete',
    /** Хаб кампании: выбор миссий (ангар) */
    HANGAR: 'Hangar'
};

/**
 * Запрос смены состояния для bootstrap в index (currentState).
 * @param {'MISSION_COMPLETE'|'HANGAR'|'PLAYING'|'MENU'} key
 */
GameState.transitionTo = function transitionTo(key) {
    const map = {
        MISSION_COMPLETE: GameState.MISSION_COMPLETE,
        HANGAR: GameState.HANGAR,
        PLAYING: GameState.PLAYING,
        MENU: GameState.MENU
    };
    const state = map[key];
    if (!state || typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('skyace-state-transition', { detail: { key, state } }));
};

export const BossState = {
    ENTERING: 'Entering',
    ACTIVE: 'Active',
    DESTROYED: 'Destroyed',
    LEAVING: 'Leaving'
};
