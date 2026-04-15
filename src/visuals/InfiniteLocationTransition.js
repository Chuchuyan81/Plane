import {
    ENDLESS_ENV_SEQUENCE,
    ENDLESS_LOCATION_PHASE_M,
    ENDLESS_LOCATION_BLEND_M
} from '../config/LocationBiomeConfig.js';

/**
 * Плавная смена пресетов окружения в бесконечном режиме по дистанции.
 * @param {number} distance — метры (physics.distance)
 * @param {number} playerZ — world Z игрока
 * @param {{ physics: import('../core/Physics.js').PhysicsEngine, locationGroundScenery: import('./LocationGroundScenery.js').LocationGroundScenery }} deps
 */
export function tickInfiniteLocationTransition(distance, playerZ, deps) {
    const { physics, locationGroundScenery } = deps;
    if (!physics || !locationGroundScenery) return;

    const seq = ENDLESS_ENV_SEQUENCE;
    const L = ENDLESS_LOCATION_PHASE_M;
    const B = ENDLESS_LOCATION_BLEND_M;
    const stableEnd = Math.max(0, L - B);

    const i = Math.floor(distance / L) % seq.length;
    const local = distance % L;

    const keyA = seq[i];
    const keyB = local >= stableEnd ? seq[(i + 1) % seq.length] : keyA;
    const t = local >= stableEnd ? Math.max(0, Math.min(1, (local - stableEnd) / B)) : 0;

    physics.applyEnvironmentLerp(keyA, keyB, t);
    locationGroundScenery.setBlend(keyA, keyB, t, playerZ);
    locationGroundScenery.tickScroll(playerZ, keyA, keyB, t);
}
