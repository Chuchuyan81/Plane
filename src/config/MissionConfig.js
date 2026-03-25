/**
 * Конфигурация 15 миссий кампании «Вторжение» и пресеты окружения.
 * Баланс правится здесь без изменения игрового кода.
 */

/** Пресеты визуальной среды (Three.js hex, туман, плотность облаков 0..1) */
export const EnvironmentConfig = {
    DAY: {
        key: 'DAY',
        skyColor: 0x87ceeb,
        fogNear: 100,
        fogFar: 500,
        groundColor: 0x3b7d3b,
        cloudDensity: 0.85,
        hemiIntensity: 0.6,
        dirIntensity: 0.85
    },
    DENSE_CLOUD: {
        key: 'DENSE_CLOUD',
        skyColor: 0xa8c4e0,
        fogNear: 80,
        fogFar: 380,
        groundColor: 0x2d5a3d,
        cloudDensity: 0.95,
        hemiIntensity: 0.55,
        dirIntensity: 0.75
    },
    NIGHT_CITY: {
        key: 'NIGHT_CITY',
        skyColor: 0x0a0a2a,
        fogNear: 60,
        fogFar: 420,
        groundColor: 0x1a2a1a,
        cloudDensity: 0.45,
        hemiIntensity: 0.35,
        dirIntensity: 0.45
    },
    STORM: {
        key: 'STORM',
        skyColor: 0x2a2a3a,
        fogNear: 50,
        fogFar: 320,
        groundColor: 0x2a4a3a,
        cloudDensity: 0.92,
        hemiIntensity: 0.4,
        dirIntensity: 0.55
    },
    OCEAN_DAWN: {
        key: 'OCEAN_DAWN',
        skyColor: 0xffa07a,
        fogNear: 90,
        fogFar: 480,
        groundColor: 0x3a5c6b,
        cloudDensity: 0.7,
        hemiIntensity: 0.65,
        dirIntensity: 0.8
    },
    STRATOSPHERE: {
        key: 'STRATOSPHERE',
        skyColor: 0x1a2a4a,
        fogNear: 120,
        fogFar: 550,
        groundColor: 0x2a3a55,
        cloudDensity: 0.35,
        hemiIntensity: 0.5,
        dirIntensity: 0.75
    },
    SPACE_DEBRIS: {
        key: 'SPACE_DEBRIS',
        skyColor: 0x050510,
        fogNear: 150,
        fogFar: 600,
        groundColor: 0x1a1a22,
        cloudDensity: 0.12,
        hemiIntensity: 0.25,
        dirIntensity: 0.5
    },
    AURORA: {
        key: 'AURORA',
        skyColor: 0x0a1a2a,
        fogNear: 70,
        fogFar: 450,
        groundColor: 0x1a3a2a,
        cloudDensity: 0.4,
        hemiIntensity: 0.45,
        dirIntensity: 0.55
    },
    ORBITAL: {
        key: 'ORBITAL',
        skyColor: 0x000018,
        fogNear: 100,
        fogFar: 580,
        groundColor: 0x151520,
        cloudDensity: 0.08,
        hemiIntensity: 0.2,
        dirIntensity: 0.55
    },
    MOON_SHADOW: {
        key: 'MOON_SHADOW',
        skyColor: 0x020208,
        fogNear: 40,
        fogFar: 350,
        groundColor: 0x0a0a12,
        cloudDensity: 0.15,
        hemiIntensity: 0.15,
        dirIntensity: 0.35
    },
    VOID_MIST: {
        key: 'VOID_MIST',
        skyColor: 0x1a0a2a,
        fogNear: 55,
        fogFar: 360,
        groundColor: 0x2a1a3a,
        cloudDensity: 0.55,
        hemiIntensity: 0.35,
        dirIntensity: 0.45
    },
    ASTEROID_FIELD: {
        key: 'ASTEROID_FIELD',
        skyColor: 0x1a1a2a,
        fogNear: 80,
        fogFar: 480,
        groundColor: 0x252530,
        cloudDensity: 0.2,
        hemiIntensity: 0.3,
        dirIntensity: 0.5
    },
    FLEET_BATTLE: {
        key: 'FLEET_BATTLE',
        skyColor: 0x1a1525,
        fogNear: 70,
        fogFar: 400,
        groundColor: 0x2a2035,
        cloudDensity: 0.5,
        hemiIntensity: 0.4,
        dirIntensity: 0.55
    },
    MOTHERSHIP: {
        key: 'MOTHERSHIP',
        skyColor: 0x2a1a1a,
        fogNear: 50,
        fogFar: 380,
        groundColor: 0x3a2a2a,
        cloudDensity: 0.35,
        hemiIntensity: 0.38,
        dirIntensity: 0.5
    },
    VOID_CORE: {
        key: 'VOID_CORE',
        skyColor: 0x120818,
        fogNear: 45,
        fogFar: 340,
        groundColor: 0x1a1028,
        cloudDensity: 0.4,
        hemiIntensity: 0.32,
        dirIntensity: 0.42
    }
};

/**
 * @typedef {object} MissionDefinition
 * @property {number} id 1..15
 * @property {string} title
 * @property {number|null} requiresMissionId предыдущая миссия (null для первой)
 * @property {keyof typeof EnvironmentConfig} environment
 * @property {number} bossHPMultiplier множитель к базовому HP босса миссии
 * @property {number} enemySpawnMultiplier множитель частоты спавна (× к модификатору сложности)
 * @property {number} bossScoreThreshold абсолютный счёт для появления босса
 * @property {number} baseCredits базовая награда (итог: × (1 + 0.1 × звёзды))
 * @property {number} bonusCreditsPerStar доп. кредиты за звезду сверх формулы (опционально 0)
 */

/** @type {MissionDefinition[]} */
export const MISSIONS = [
    {
        id: 1,
        title: 'Первый контакт',
        requiresMissionId: null,
        environment: 'DAY',
        bossHPMultiplier: 0.62,
        enemySpawnMultiplier: 0.58,
        bossScoreThreshold: 3600,
        baseCredits: 500,
        bonusCreditsPerStar: 0
    },
    {
        id: 2,
        title: 'Облачный патруль',
        requiresMissionId: 1,
        environment: 'DENSE_CLOUD',
        bossHPMultiplier: 0.68,
        enemySpawnMultiplier: 0.62,
        bossScoreThreshold: 4000,
        baseCredits: 600,
        bonusCreditsPerStar: 0
    },
    {
        id: 3,
        title: 'Ночной дозор',
        requiresMissionId: 2,
        environment: 'NIGHT_CITY',
        bossHPMultiplier: 0.75,
        enemySpawnMultiplier: 0.68,
        bossScoreThreshold: 4200,
        baseCredits: 700,
        bonusCreditsPerStar: 0
    },
    {
        id: 4,
        title: 'Штормовой фронт',
        requiresMissionId: 3,
        environment: 'STORM',
        bossHPMultiplier: 0.88,
        enemySpawnMultiplier: 0.78,
        bossScoreThreshold: 5200,
        baseCredits: 800,
        bonusCreditsPerStar: 0
    },
    {
        id: 5,
        title: 'Прибрежная блокада',
        requiresMissionId: 4,
        environment: 'OCEAN_DAWN',
        bossHPMultiplier: 0.98,
        enemySpawnMultiplier: 0.88,
        bossScoreThreshold: 5800,
        baseCredits: 1000,
        bonusCreditsPerStar: 0
    },
    {
        id: 6,
        title: 'Стратосфера',
        requiresMissionId: 5,
        environment: 'STRATOSPHERE',
        bossHPMultiplier: 1.05,
        enemySpawnMultiplier: 0.92,
        bossScoreThreshold: 6200,
        baseCredits: 1200,
        bonusCreditsPerStar: 0
    },
    {
        id: 7,
        title: 'Кладбище спутников',
        requiresMissionId: 6,
        environment: 'SPACE_DEBRIS',
        bossHPMultiplier: 1.12,
        enemySpawnMultiplier: 0.98,
        bossScoreThreshold: 6800,
        baseCredits: 1400,
        bonusCreditsPerStar: 0
    },
    {
        id: 8,
        title: 'Северное сияние',
        requiresMissionId: 7,
        environment: 'AURORA',
        bossHPMultiplier: 1.2,
        enemySpawnMultiplier: 1.05,
        bossScoreThreshold: 7200,
        baseCredits: 1600,
        bonusCreditsPerStar: 0
    },
    {
        id: 9,
        title: 'Орбитальная платформа',
        requiresMissionId: 8,
        environment: 'ORBITAL',
        bossHPMultiplier: 1.35,
        enemySpawnMultiplier: 1.12,
        bossScoreThreshold: 7800,
        baseCredits: 1800,
        bonusCreditsPerStar: 0
    },
    {
        id: 10,
        title: 'Тень луны',
        requiresMissionId: 9,
        environment: 'MOON_SHADOW',
        bossHPMultiplier: 1.48,
        enemySpawnMultiplier: 1.18,
        bossScoreThreshold: 8400,
        baseCredits: 2000,
        bonusCreditsPerStar: 0
    },
    {
        id: 11,
        title: 'Врата пустоты',
        requiresMissionId: 10,
        environment: 'VOID_MIST',
        bossHPMultiplier: 1.62,
        enemySpawnMultiplier: 1.22,
        bossScoreThreshold: 9200,
        baseCredits: 2500,
        bonusCreditsPerStar: 0
    },
    {
        id: 12,
        title: 'Астероидный пояс',
        requiresMissionId: 11,
        environment: 'ASTEROID_FIELD',
        bossHPMultiplier: 1.78,
        enemySpawnMultiplier: 1.28,
        bossScoreThreshold: 9800,
        baseCredits: 3000,
        bonusCreditsPerStar: 0
    },
    {
        id: 13,
        title: 'Перехват флота',
        requiresMissionId: 12,
        environment: 'FLEET_BATTLE',
        bossHPMultiplier: 1.92,
        enemySpawnMultiplier: 1.32,
        bossScoreThreshold: 10500,
        baseCredits: 3500,
        bonusCreditsPerStar: 0
    },
    {
        id: 14,
        title: 'Подход к материнскому',
        requiresMissionId: 13,
        environment: 'MOTHERSHIP',
        bossHPMultiplier: 2.05,
        enemySpawnMultiplier: 1.36,
        bossScoreThreshold: 11200,
        baseCredits: 4000,
        bonusCreditsPerStar: 0
    },
    {
        id: 15,
        title: 'Ядро вторжения',
        requiresMissionId: 14,
        environment: 'VOID_CORE',
        bossHPMultiplier: 2.2,
        enemySpawnMultiplier: 1.42,
        bossScoreThreshold: 12000,
        baseCredits: 5000,
        bonusCreditsPerStar: 0
    }
];

const MISSION_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

/**
 * @param {number} missionId
 * @returns {MissionDefinition|undefined}
 */
export function getMissionById(missionId) {
    return MISSION_BY_ID.get(missionId);
}

/**
 * Кредиты за миссию по дизайну: Base × (1 + 0.1 × stars) + бонус за звезду из конфига.
 * @param {MissionDefinition} mission
 * @param {number} stars 1..3
 */
export function calculateMissionCredits(mission, stars) {
    const s = Math.min(3, Math.max(1, stars | 0));
    const base = Math.floor(mission.baseCredits * (1 + 0.1 * s));
    return base + (mission.bonusCreditsPerStar || 0) * s;
}

/**
 * Звёзды: прохождение = 1; комбо = +1; без урона в бою с боссом = условие 3-й звезды при хорошем комбо.
 * @param {{ playerNoDamage: boolean, maxCombo: number }} run
 */
export function computeMissionStars(run) {
    const maxCombo = Math.floor(Number(run.maxCombo) || 1);
    let stars = 1;
    if (maxCombo >= 4) stars = 2;
    if (run.playerNoDamage && maxCombo >= 5) stars = 3;
    else if (run.playerNoDamage && maxCombo >= 4) stars = Math.max(stars, 2);
    return Math.min(3, stars);
}
