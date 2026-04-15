import { GAME_CONSTANTS } from '../utils/constants.js';
import { EnvironmentConfig } from '../config/MissionConfig.js';

/**
 * Логика физики, дистанции и пресетов окружения миссии (небо, туман, облака, дождь, частицы).
 */
export class PhysicsEngine {
    constructor() {
        this.distance = 0;
        this.difficulty = 1.0;
        this.speedModifiers = GAME_CONSTANTS.OBSTACLE_SPEED_MODIFIERS;
        this.spawnModifiers = GAME_CONSTANTS.ENEMY_SPAWN_MODIFIERS;
        /** Заморозка прогресса дистанции (бой с боссом) */
        this._distanceProgressFrozen = false;
        this._frozenDistance = 0;

        /** Плотность облаков 0..1 (последний пресет миссии) */
        this.cloudDensity = 0.85;
        /** Видимость 0..1 — влияет на туман */
        this.visibility = 1;

        /**
         * @type {{
         *   THREE: typeof import('three'),
         *   scene: import('three').Scene,
         *   groundMat?: import('three').MeshPhongMaterial,
         *   clouds: import('three').Object3D[],
         *   hemiLight?: import('three').HemisphereLight,
         *   dirLight?: import('three').DirectionalLight,
         *   markerPool?: import('../objects/GroundMarkerPool.js').GroundMarkerPool,
         *   locationGroundScenery?: import('../visuals/LocationGroundScenery.js').LocationGroundScenery
         * } | null}
         */
        this._envCtx = null;
        this._rainGroup = null;
        this._rainGeom = null;
        this._rainPositions = null;
        this._rainVel = null;
        this._rainMaterial = null;
        this._voidGroup = null;
        this._voidGeom = null;
        this._voidPositions = null;
        this._voidMaterial = null;
        this._activeWeather = null;
        this._activeParticles = null;
    }

    /**
     * Привязка к сцене (вызывать из index после создания мира).
     * @param {object} ctx
     */
    setEnvironmentContext(ctx) {
        this._envCtx = ctx;
    }

    /**
     * @param {object} envConfig
     * @returns {number}
     */
    _visibilityOf(envConfig) {
        return typeof envConfig.visibility === 'number' ? envConfig.visibility : 1;
    }

    /**
     * @param {object} envConfig
     * @param {number} vis
     * @returns {{ fogNear: number, fogFar: number }}
     */
    _fogDistances(envConfig, vis) {
        return {
            fogNear: envConfig.fogNear * (1.12 - vis * 0.1),
            fogFar: envConfig.fogFar * (0.78 + vis * 0.26)
        };
    }

    /**
     * Небо, туман, свет, облака, цвет земли (без погодных частиц и маркеров).
     * @param {object} envConfig
     */
    _applyVisualCore(envConfig) {
        const ctx = this._envCtx;
        if (!ctx || !ctx.THREE || !ctx.scene) return;
        const THREE = ctx.THREE;
        const { scene, groundMat, clouds, hemiLight, dirLight } = ctx;
        const vis = this._visibilityOf(envConfig);
        this.visibility = vis;
        this.cloudDensity = envConfig.cloudDensity;

        scene.background = new THREE.Color(envConfig.skyColor);

        const { fogNear, fogFar } = this._fogDistances(envConfig, vis);
        scene.fog = new THREE.Fog(envConfig.skyColor, fogNear, fogFar);

        const skipGroundColor = !!ctx.locationGroundScenery;
        if (!skipGroundColor && groundMat && groundMat.color) {
            groundMat.color.setHex(envConfig.groundColor);
        }
        if (hemiLight && typeof envConfig.hemiIntensity === 'number') {
            hemiLight.intensity = envConfig.hemiIntensity;
        }
        if (dirLight && typeof envConfig.dirIntensity === 'number') {
            dirLight.intensity = envConfig.dirIntensity;
        }

        if (Array.isArray(clouds) && clouds.length > 0) {
            const visibleCount = Math.max(0, Math.round(clouds.length * envConfig.cloudDensity));
            clouds.forEach((c, i) => {
                if (c) c.visible = i < visibleCount;
            });
        }
    }

    /**
     * Плавное смешение двух пресетов (бесконечный режим).
     * @param {string} keyA
     * @param {string} keyB
     * @param {number} t 0..1
     */
    applyEnvironmentLerp(keyA, keyB, t) {
        const ctx = this._envCtx;
        if (!ctx || !ctx.THREE || !ctx.scene) return;
        const THREE = ctx.THREE;
        const envA = EnvironmentConfig[keyA];
        const envB = EnvironmentConfig[keyB];
        if (!envA || !envB) return;

        const tt = Math.max(0, Math.min(1, t));
        const visA = this._visibilityOf(envA);
        const visB = this._visibilityOf(envB);
        const vis = visA * (1 - tt) + visB * tt;

        const fogA = this._fogDistances(envA, visA);
        const fogB = this._fogDistances(envB, visB);
        const fogNear = fogA.fogNear * (1 - tt) + fogB.fogNear * tt;
        const fogFar = fogA.fogFar * (1 - tt) + fogB.fogFar * tt;

        const sky = new THREE.Color(envA.skyColor).lerp(new THREE.Color(envB.skyColor), tt);
        ctx.scene.background = sky.clone();
        ctx.scene.fog = new THREE.Fog(sky.getHex(), fogNear, fogFar);

        const skipGroundColor = !!ctx.locationGroundScenery;
        if (!skipGroundColor && ctx.groundMat && ctx.groundMat.color) {
            const gc = new THREE.Color(envA.groundColor).lerp(new THREE.Color(envB.groundColor), tt);
            ctx.groundMat.color.copy(gc);
        }

        if (ctx.hemiLight) {
            const hA = typeof envA.hemiIntensity === 'number' ? envA.hemiIntensity : 0.5;
            const hB = typeof envB.hemiIntensity === 'number' ? envB.hemiIntensity : 0.5;
            ctx.hemiLight.intensity = hA * (1 - tt) + hB * tt;
        }
        if (ctx.dirLight) {
            const dA = typeof envA.dirIntensity === 'number' ? envA.dirIntensity : 0.6;
            const dB = typeof envB.dirIntensity === 'number' ? envB.dirIntensity : 0.6;
            ctx.dirLight.intensity = dA * (1 - tt) + dB * tt;
        }

        const dens = envA.cloudDensity * (1 - tt) + envB.cloudDensity * tt;
        this.cloudDensity = dens;
        this.visibility = vis;
        if (Array.isArray(ctx.clouds) && ctx.clouds.length > 0) {
            const visibleCount = Math.max(0, Math.round(ctx.clouds.length * dens));
            ctx.clouds.forEach((c, i) => {
                if (c) c.visible = i < visibleCount;
            });
        }

        const dominant = tt >= 0.5 ? envB : envA;
        this._lastEnvConfig = dominant;
        this.updateGroundMarkers(dominant);

        const rainStrength =
            (envA.weather === 'rain' ? 1 : 0) * (1 - tt) + (envB.weather === 'rain' ? 1 : 0) * tt;
        const voidStrength =
            (envA.particles === 'purple' ? 1 : 0) * (1 - tt) +
            (envB.particles === 'purple' ? 1 : 0) * tt;
        this._syncWeatherEffectsLerp(rainStrength, voidStrength, THREE, ctx.scene);

        this._activeWeather = rainStrength > 0.5 ? 'rain' : null;
        this._activeParticles = voidStrength > 0.5 ? 'purple' : null;
    }

    /**
     * @param {number} rainStrength 0..1
     * @param {number} voidStrength 0..1
     */
    _syncWeatherEffectsLerp(rainStrength, voidStrength, THREE, scene) {
        if (rainStrength > 0.008) {
            this._enableRainParticles(THREE, scene);
            if (this._rainMaterial) {
                const base = this._rainMaterial.userData.baseOpacity ?? 0.45;
                this._rainMaterial.opacity = base * Math.min(1, rainStrength);
                this._rainGroup.visible = true;
            }
        } else {
            this._disableRainParticles(scene);
        }

        if (voidStrength > 0.008) {
            this._enableVoidParticles(THREE, scene);
            if (this._voidMaterial) {
                const base = this._voidMaterial.userData.baseOpacity ?? 0.35;
                this._voidMaterial.opacity = base * Math.min(1, voidStrength);
                this._voidGroup.visible = true;
            }
        } else {
            this._disableVoidParticles(scene);
        }
    }

    /**
     * Применить пресет окружения по ключу из EnvironmentConfig.
     * @param {keyof typeof EnvironmentConfig|string} environmentType
     */
    setMissionEnvironment(environmentType) {
        const envConfig = EnvironmentConfig[environmentType];
        const ctx = this._envCtx;
        if (!envConfig || !ctx) return;

        const THREE = ctx.THREE;
        const { scene } = ctx;
        if (!scene || !THREE) return;

        this._applyVisualCore(envConfig);
        this.updateGroundMarkers(envConfig);
        this._syncWeatherEffects(envConfig, THREE, scene);

        if (ctx.locationGroundScenery && typeof ctx.locationGroundScenery.applyInstant === 'function') {
            ctx.locationGroundScenery.applyInstant(environmentType);
        }
    }

    /**
     * Обновить стиль наземных маркеров под текущую миссию.
     * @param {object} envConfig
     */
    updateGroundMarkers(envConfig) {
        const markerPool = this._envCtx?.markerPool;
        if (!markerPool) return;
        const markers = [...markerPool.pool, ...markerPool.active];
        for (const m of markers) {
            if (m && typeof m.applyEnvironment === 'function') {
                m.applyEnvironment(envConfig);
            }
        }
    }

    /**
     * Анимация дождя и пустотных частиц (каждый кадр).
     * @param {number} dt
     * @param {number} playerZ позиция Z игрока
     */
    updateMissionEnvironmentEffects(dt, playerZ) {
        const THREE = this._envCtx?.THREE;
        if (!THREE) return;

        if (this._rainGroup && this._rainGroup.visible && this._rainPositions && this._rainVel) {
            const pos = this._rainPositions;
            const vel = this._rainVel;
            const n = vel.length;
            const lowY = -30;
            const highY = 85;
            for (let i = 0; i < n; i++) {
                const ix = i * 3;
                pos[ix + 1] -= vel[i] * dt * 70;
                pos[ix + 2] += (Math.random() - 0.4) * 14 * dt;
                if (pos[ix + 1] < lowY) {
                    pos[ix + 1] = highY + Math.random() * 25;
                    pos[ix] = (Math.random() - 0.5) * 120;
                    pos[ix + 2] = playerZ - Math.random() * 500;
                }
            }
            this._rainGeom.attributes.position.needsUpdate = true;
        }

        if (this._voidGroup && this._voidGroup.visible && this._voidPositions) {
            const pos = this._voidPositions;
            const t = performance.now() * 0.0005;
            for (let i = 0; i < pos.length / 3; i++) {
                const ix = i * 3;
                pos[ix + 1] += Math.sin(t + i) * 0.08 * dt * 60;
                pos[ix] += Math.cos(t * 0.7 + i * 0.2) * 0.05 * dt * 60;
            }
            this._voidGeom.attributes.position.needsUpdate = true;
        }
    }

    _syncWeatherEffects(envConfig, THREE, scene) {
        const weather = envConfig.weather;
        const particles = envConfig.particles;

        if (weather === 'rain') {
            this._enableRainParticles(THREE, scene);
            if (this._rainMaterial) {
                this._rainMaterial.opacity = this._rainMaterial.userData.baseOpacity ?? 0.45;
            }
        } else {
            this._disableRainParticles(scene);
        }

        if (particles === 'purple') {
            this._enableVoidParticles(THREE, scene);
            if (this._voidMaterial) {
                this._voidMaterial.opacity = this._voidMaterial.userData.baseOpacity ?? 0.35;
            }
        } else {
            this._disableVoidParticles(scene);
        }

        this._activeWeather = weather || null;
        this._activeParticles = particles || null;
        this._lastEnvConfig = envConfig;
    }

    /**
     * Применить последний пресет к одному маркеру (после spawn из пула).
     * @param {import('../objects/GroundMarker.js').GroundMarker} marker
     */
    stylizeGroundMarker(marker) {
        if (this._lastEnvConfig && marker && typeof marker.applyEnvironment === 'function') {
            marker.applyEnvironment(this._lastEnvConfig);
        }
    }

    _enableRainParticles(THREE, scene) {
        if (this._rainGroup) {
            this._rainGroup.visible = true;
            return;
        }
        const count = 900;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            positions[ix] = (Math.random() - 0.5) * 140;
            positions[ix + 1] = 20 + Math.random() * 80;
            positions[ix + 2] = -Math.random() * 600;
            velocities[i] = 0.85 + Math.random() * 0.35;
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xaaccff,
            size: 0.22,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        mat.userData.baseOpacity = 0.45;
        this._rainMaterial = mat;
        this._rainGroup = new THREE.Points(geom, mat);
        this._rainGroup.name = 'skyace-rain';
        this._rainGroup.renderOrder = 2;
        scene.add(this._rainGroup);
        this._rainGeom = geom;
        this._rainPositions = positions;
        this._rainVel = velocities;
    }

    _disableRainParticles(scene) {
        if (this._rainGroup) {
            this._rainGroup.visible = false;
        }
    }

    _enableVoidParticles(THREE, scene) {
        if (this._voidGroup) {
            this._voidGroup.visible = true;
            return;
        }
        const count = 350;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            positions[ix] = (Math.random() - 0.5) * 100;
            positions[ix + 1] = 10 + Math.random() * 50;
            positions[ix + 2] = -Math.random() * 500;
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xcc66ff,
            size: 0.35,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        mat.userData.baseOpacity = 0.35;
        this._voidMaterial = mat;
        this._voidGroup = new THREE.Points(geom, mat);
        this._voidGroup.name = 'skyace-void-particles';
        this._voidGroup.renderOrder = 1;
        scene.add(this._voidGroup);
        this._voidGeom = geom;
        this._voidPositions = positions;
    }

    _disableVoidParticles(scene) {
        if (this._voidGroup) {
            this._voidGroup.visible = false;
        }
    }

    /**
     * Заморозить прогресс дистанции (во время BOSS_FIGHT)
     */
    freezeDistanceProgress() {
        this._distanceProgressFrozen = true;
        this._frozenDistance = this.distance;
    }

    /**
     * Возобновить обновление дистанции по позиции игрока
     */
    resumeDistanceProgress() {
        this._distanceProgressFrozen = false;
    }

    /**
     * Обновление пройденной дистанции
     * @param {THREE.Vector3} playerPosition - позиция игрока
     */
    updateDistance(playerPosition) {
        if (this._distanceProgressFrozen) {
            return this._frozenDistance;
        }
        this.distance = Math.floor(Math.max(0, -playerPosition.z));
        return this.distance;
    }

    /**
     * Получение текущей дистанции
     */
    getDistance() {
        return this.distance;
    }

    /**
     * Сброс дистанции
     * @param {number} value - начальное значение (например, из чек-поинта)
     */
    resetDistance(value = 0) {
        this.distance = value;
        this._frozenDistance = value;
        this._distanceProgressFrozen = false;
    }

    /**
     * Расчёт параметров сложности на основе выбранного уровня
     * @param {string} level - 'easy' | 'medium' | 'hard'
     */
    getDifficultyModifiers(level) {
        return {
            speed: this.speedModifiers[level] || 1.0,
            spawn: this.spawnModifiers[level] || 1.0
        };
    }
}

export const physics = new PhysicsEngine();
