import { EnvironmentConfig } from '../config/MissionConfig.js';

/**
 * Применяет пресет окружения к сцене и видимости облаков (без смены геометрии).
 * @param {object} params — scene, groundMat, clouds; THREE из window; опционально hemiLight, dirLight
 * @param {keyof typeof EnvironmentConfig|string} envKey
 */
export function applyMissionEnvironment({
    THREE,
    scene,
    groundMat,
    clouds,
    hemiLight,
    dirLight
}, envKey) {
    const env = EnvironmentConfig[envKey];
    if (!env || !scene || !THREE) return;

    scene.background = new THREE.Color(env.skyColor);
    scene.fog = new THREE.Fog(env.skyColor, env.fogNear, env.fogFar);
    if (groundMat && groundMat.color) {
        groundMat.color.setHex(env.groundColor);
    }
    if (hemiLight && typeof env.hemiIntensity === 'number') {
        hemiLight.intensity = env.hemiIntensity;
    }
    if (dirLight && typeof env.dirIntensity === 'number') {
        dirLight.intensity = env.dirIntensity;
    }
    if (Array.isArray(clouds) && clouds.length > 0) {
        const visibleCount = Math.max(0, Math.round(clouds.length * env.cloudDensity));
        clouds.forEach((c, i) => {
            if (c) c.visible = i < visibleCount;
        });
    }
}
