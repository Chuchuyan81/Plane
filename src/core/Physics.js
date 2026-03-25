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
         *   markerPool?: import('../objects/GroundMarkerPool.js').GroundMarkerPool
         * } | null}
         */
        this._envCtx = null;
        this._rainGroup = null;
        this._rainGeom = null;
        this._rainPositions = null;
        this._rainVel = null;
        this._voidGroup = null;
        this._voidGeom = null;
        this._voidPositions = null;
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
     * Применить пресет окружения по ключу из EnvironmentConfig.
     * @param {keyof typeof EnvironmentConfig|string} environmentType
     */
    setMissionEnvironment(environmentType) {
        const envConfig = EnvironmentConfig[environmentType];
        const ctx = this._envCtx;
        if (!envConfig || !ctx) return;

        const THREE = ctx.THREE;
        const { scene, groundMat, clouds, hemiLight, dirLight } = ctx;
        if (!scene || !THREE) return;

        const vis = typeof envConfig.visibility === 'number' ? envConfig.visibility : 1;
        this.visibility = vis;
        this.cloudDensity = envConfig.cloudDensity;

        scene.background = new THREE.Color(envConfig.skyColor);

        const fogNear = envConfig.fogNear * (1.12 - vis * 0.1);
        const fogFar = envConfig.fogFar * (0.78 + vis * 0.26);
        scene.fog = new THREE.Fog(envConfig.skyColor, fogNear, fogFar);

        if (groundMat && groundMat.color) {
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

        this.updateGroundMarkers(envConfig);
        this._syncWeatherEffects(envConfig, THREE, scene);
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
        } else {
            this._disableRainParticles(scene);
        }

        if (particles === 'purple') {
            this._enableVoidParticles(THREE, scene);
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
        console.log('[Physics] Distance progress frozen at', this._frozenDistance);
    }

    /**
     * Возобновить обновление дистанции по позиции игрока
     */
    resumeDistanceProgress() {
        this._distanceProgressFrozen = false;
        console.log('[Physics] Distance progress resumed');
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
