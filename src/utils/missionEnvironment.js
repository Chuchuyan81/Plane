import { physics } from '../core/Physics.js';

/**
 * Применяет пресет окружения (делегирует в PhysicsEngine).
 * @param {object} params — scene, groundMat, clouds; THREE из window; опционально hemiLight, dirLight, markerPool
 * @param {string} envKey
 */
export function applyMissionEnvironment(params, envKey) {
    physics.setEnvironmentContext(params);
    physics.setMissionEnvironment(envKey);
}
