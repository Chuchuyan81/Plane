import { MISSIONS, getMissionById, calculateMissionCredits } from '../config/MissionConfig.js';

export const CAMPAIGN_STORAGE_KEY = 'skyace_campaign';
/** Текущая версия схемы сохранения (миграции по version в JSON) */
export const CAMPAIGN_DATA_VERSION = 1;

/**
 * @typedef {object} MissionProgressRecord
 * @property {boolean} completed
 * @property {number} stars
 * @property {number} bestScore
 * @property {number} [bestCreditsAwarded] лучший начисленный итог кредитов за прохождение (база+комбо)
 * @property {string} [lastCompletedAt] ISO
 */

/**
 * @typedef {object} CampaignData
 * @property {number} version
 * @property {number} totalCredits
 * @property {{ hull: number, weapons: number, engine: number, systems: number }} upgrades
 * @property {Record<string, MissionProgressRecord>} missions
 */

function defaultCampaignData() {
    return {
        version: CAMPAIGN_DATA_VERSION,
        totalCredits: 0,
        upgrades: { hull: 0, weapons: 0, engine: 0, systems: 0 },
        missions: {}
    };
}

/**
 * Миграция с черновика из дизайн-документа (массив completedMissions, currentMission).
 * @param {object} raw
 * @returns {CampaignData}
 */
function migrateFromLegacyShape(raw) {
    const out = defaultCampaignData();
    if (typeof raw.totalCredits === 'number' && raw.totalCredits >= 0) {
        out.totalCredits = Math.floor(raw.totalCredits);
    }
    if (raw.upgrades && typeof raw.upgrades === 'object') {
        out.upgrades = {
            hull: Number(raw.upgrades.hull) || 0,
            weapons: Number(raw.upgrades.weapons) || 0,
            engine: Number(raw.upgrades.engine) || 0,
            systems: Number(raw.upgrades.systems) || 0
        };
    }
    const completed = raw.completedMissions;
    if (Array.isArray(completed)) {
        for (const id of completed) {
            const mid = String(id);
            out.missions[mid] = {
                completed: true,
                stars: 1,
                bestScore: 0,
                lastCompletedAt: new Date().toISOString()
            };
        }
    }
    return out;
}

/**
 * @returns {CampaignData}
 */
export function loadCampaignData() {
    let rawText = null;
    try {
        rawText = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    } catch (e) {
        console.warn('[campaignStorage] localStorage read failed', e);
        return defaultCampaignData();
    }
    if (!rawText) return defaultCampaignData();

    let raw;
    try {
        raw = JSON.parse(rawText);
    } catch (e) {
        console.warn('[campaignStorage] corrupt JSON, reset', e);
        return defaultCampaignData();
    }

    if (!raw || typeof raw !== 'object') return defaultCampaignData();

    if (Array.isArray(raw.completedMissions) || raw.currentMission !== undefined) {
        const migrated = migrateFromLegacyShape(raw);
        migrated.version = CAMPAIGN_DATA_VERSION;
        saveCampaignData(migrated);
        return migrated;
    }

    const ver = Number(raw.version) || 0;
    let data = defaultCampaignData();
    data.totalCredits = Math.max(0, Math.floor(Number(raw.totalCredits) || 0));
    if (raw.upgrades && typeof raw.upgrades === 'object') {
        data.upgrades = {
            hull: Number(raw.upgrades.hull) || 0,
            weapons: Number(raw.upgrades.weapons) || 0,
            engine: Number(raw.upgrades.engine) || 0,
            systems: Number(raw.upgrades.systems) || 0
        };
    }
    if (raw.missions && typeof raw.missions === 'object') {
        data.missions = { ...raw.missions };
    }
    data.version = ver >= CAMPAIGN_DATA_VERSION ? ver : CAMPAIGN_DATA_VERSION;

    if (ver < CAMPAIGN_DATA_VERSION) {
        data.version = CAMPAIGN_DATA_VERSION;
        saveCampaignData(data);
    }

    return data;
}

/**
 * @param {CampaignData} data
 */
export function saveCampaignData(data) {
    const payload = {
        ...data,
        version: CAMPAIGN_DATA_VERSION
    };
    try {
        localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error('[campaignStorage] localStorage write failed', e);
    }
}

/**
 * @param {number} missionId
 * @param {CampaignData} [data]
 * @returns {'locked'|'available'|'completed'}
 */
export function getMissionStatus(missionId, data = loadCampaignData()) {
    const m = getMissionById(missionId);
    if (!m) return 'locked';
    const key = String(missionId);
    const rec = data.missions[key];
    if (rec && rec.completed) return 'completed';

    if (m.requiresMissionId == null) return 'available';
    const reqKey = String(m.requiresMissionId);
    const req = data.missions[reqKey];
    if (req && req.completed) return 'available';
    return 'locked';
}

/**
 * Первая миссия со статусом «доступна» (разблокирована и ещё не пройдена).
 * @param {CampaignData} [data]
 * @returns {number|null}
 */
export function getNextAvailableMissionId(data = loadCampaignData()) {
    for (const m of MISSIONS) {
        if (getMissionStatus(m.id, data) === 'available') return m.id;
    }
    return null;
}

/**
 * Записать результат миссии и кредиты (немедленный flush в localStorage).
 * Кредиты начисляются только за прирост качества относительно уже сохранённого прохождения.
 *
 * @param {number} missionId
 * @param {{ stars: number, score: number, creditsAwarded?: number }} result
 * @returns {{ creditsEarned: number, totalCredits: number }}
 */
export function recordMissionComplete(missionId, result) {
    const mission = getMissionById(missionId);
    if (!mission) {
        console.warn('[campaignStorage] unknown mission', missionId);
        return { creditsEarned: 0, totalCredits: loadCampaignData().totalCredits };
    }

    const data = loadCampaignData();
    const key = String(missionId);
    const prev = data.missions[key] || {};
    const stars = Math.min(3, Math.max(1, Math.floor(Number(result.stars) || 1)));
    const score = Math.max(0, Math.floor(Number(result.score) || 0));

    const newCreditsValue =
        result.creditsAwarded != null
            ? Math.max(0, Math.floor(Number(result.creditsAwarded)))
            : calculateMissionCredits(mission, stars);

    const prevBestCredits =
        typeof prev.bestCreditsAwarded === 'number' && prev.bestCreditsAwarded >= 0
            ? Math.floor(prev.bestCreditsAwarded)
            : prev.completed
              ? calculateMissionCredits(
                    mission,
                    Math.min(3, Math.max(1, Math.floor(prev.stars) || 1))
                )
              : 0;
    const creditsDelta = Math.max(0, newCreditsValue - prevBestCredits);

    const bestStars = prev.completed ? Math.max(prev.stars || 1, stars) : stars;
    const bestScore = prev.completed ? Math.max(prev.bestScore || 0, score) : score;
    const bestCreditsAwarded = Math.max(prevBestCredits, newCreditsValue);

    data.missions[key] = {
        completed: true,
        stars: bestStars,
        bestScore,
        bestCreditsAwarded,
        lastCompletedAt: new Date().toISOString()
    };
    data.totalCredits = Math.max(0, Math.floor(data.totalCredits + creditsDelta));

    saveCampaignData(data);
    return { creditsEarned: creditsDelta, totalCredits: data.totalCredits };
}

/**
 * Слить несохранённый буфер при уходе со страницы (на будущее; сейчас всё синхронно).
 */
export function flushCampaignStorage() {
    /* синхронные записи — заглушка для единообразия API */
}

export const campaignStorage = {
    load: loadCampaignData,
    save: saveCampaignData,
    getMissionStatus,
    getNextAvailableMissionId,
    recordMissionComplete,
    flush: flushCampaignStorage,
    calculateMissionCredits,
    missions: MISSIONS
};
