import { MISSIONS } from './MissionConfig.js';

/**
 * Визуальный биом для каждого ключа EnvironmentConfig:
 * процедурная текстура, рельеф и профиль декора (растительность / объекты).
 */

/** @typedef {'grass'|'forest'|'urban'|'water'|'alpine'|'space'|'alien'|'industrial'} BiomeSurface */

/**
 * @typedef {object} LocationBiomeDefinition
 * @property {BiomeSurface} surface
 * @property {number} textureScale — масштаб шума UV (больше = мельче)
 * @property {number} displacementScale — амплитуда рельефа (мировые единицы, слабая)
 * @property {'trees'|'urban'|'sparse'|'ocean'|'alpine'|'debris'|'crystals'|'void'|'fleet'|'mothership'} decor
 * @property {number} decorAmount — 0..1 множитель числа инстансов
 */

/** @type {Record<string, LocationBiomeDefinition>} */
export const LOCATION_BIOMES = {
    DAY: {
        surface: 'grass',
        textureScale: 1.15,
        displacementScale: 2.8,
        decor: 'trees',
        decorAmount: 0.85
    },
    DENSE_CLOUD: {
        surface: 'forest',
        textureScale: 1.35,
        displacementScale: 3.4,
        decor: 'trees',
        decorAmount: 0.95
    },
    NIGHT_CITY: {
        surface: 'urban',
        textureScale: 0.9,
        displacementScale: 1.2,
        decor: 'urban',
        decorAmount: 0.9
    },
    STORM: {
        surface: 'forest',
        textureScale: 1.4,
        displacementScale: 3.8,
        decor: 'trees',
        decorAmount: 0.75
    },
    OCEAN_DAWN: {
        surface: 'water',
        textureScale: 0.65,
        displacementScale: 1.8,
        decor: 'ocean',
        decorAmount: 0.45
    },
    STRATOSPHERE: {
        surface: 'alpine',
        textureScale: 1.5,
        displacementScale: 4.2,
        decor: 'alpine',
        decorAmount: 0.35
    },
    SPACE_DEBRIS: {
        surface: 'space',
        textureScale: 2.2,
        displacementScale: 2.0,
        decor: 'debris',
        decorAmount: 0.55
    },
    AURORA: {
        surface: 'alpine',
        textureScale: 1.25,
        displacementScale: 3.0,
        decor: 'sparse',
        decorAmount: 0.5
    },
    ORBITAL: {
        surface: 'space',
        textureScale: 2.4,
        displacementScale: 1.4,
        decor: 'debris',
        decorAmount: 0.4
    },
    MOON_SHADOW: {
        surface: 'space',
        textureScale: 2.0,
        displacementScale: 2.6,
        decor: 'debris',
        decorAmount: 0.35
    },
    VOID_MIST: {
        surface: 'alien',
        textureScale: 1.6,
        displacementScale: 3.2,
        decor: 'void',
        decorAmount: 0.7
    },
    ASTEROID_FIELD: {
        surface: 'space',
        textureScale: 2.1,
        displacementScale: 2.8,
        decor: 'debris',
        decorAmount: 0.85
    },
    FLEET_BATTLE: {
        surface: 'industrial',
        textureScale: 1.0,
        displacementScale: 1.6,
        decor: 'fleet',
        decorAmount: 0.8
    },
    MOTHERSHIP: {
        surface: 'industrial',
        textureScale: 1.05,
        displacementScale: 2.2,
        decor: 'mothership',
        decorAmount: 0.75
    },
    VOID_CORE: {
        surface: 'alien',
        textureScale: 1.7,
        displacementScale: 3.6,
        decor: 'void',
        decorAmount: 0.85
    }
};

/** Порядок смены локаций в бесконечном режиме = порядок миссий кампании */
export const ENDLESS_ENV_SEQUENCE = MISSIONS.map((m) => m.environment);

/** Длина «стабильной» фазы локации (м), затем начинается смешивание */
export const ENDLESS_LOCATION_PHASE_M = 720;
/** Длина фазы плавного перехода к следующей локации (м) */
export const ENDLESS_LOCATION_BLEND_M = 240;

/**
 * @param {string} envKey
 * @returns {LocationBiomeDefinition}
 */
export function getLocationBiome(envKey) {
    return LOCATION_BIOMES[envKey] || LOCATION_BIOMES.DAY;
}
