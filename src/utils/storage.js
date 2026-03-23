import { STORAGE_KEYS, GAME_CONSTANTS } from './constants.js';

export const storage = {
    getDifficulty() {
        return localStorage.getItem(STORAGE_KEYS.DIFFICULTY) || GAME_CONSTANTS.DIFFICULTY_LEVELS.MEDIUM;
    },
    setDifficulty(level) {
        localStorage.setItem(STORAGE_KEYS.DIFFICULTY, level);
    },
    getMarkerDetail() {
        return localStorage.getItem(STORAGE_KEYS.MARKER_DETAIL) || GAME_CONSTANTS.MARKER_DETAIL_LEVELS.MEDIUM;
    },
    setMarkerDetail(level) {
        localStorage.setItem(STORAGE_KEYS.MARKER_DETAIL, level);
    },
    getBestScore() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.BEST_SCORE)) || 0;
    },
    setBestScore(score) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score);
    },
    getTotalKills() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_KILLS)) || 0;
    },
    setTotalKills(kills) {
        localStorage.setItem(STORAGE_KEYS.TOTAL_KILLS, kills);
    },
    getTotalBosses() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_BOSSES)) || 0;
    },
    setTotalBosses(bosses) {
        localStorage.setItem(STORAGE_KEYS.TOTAL_BOSSES, bosses);
    }
};
