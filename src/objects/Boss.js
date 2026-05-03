import { BossState } from '../core/GameState.js';
import { BossConfig } from '../config/BossConfig.js';
import AudioManager from '../core/AudioManager.js';
import { spawnDeathExplosion } from '../effects/DeathExplosion.js';

export class Boss {
    /**
     * @param {object} [opts]
     * @param {number} [opts.missionHpMultiplier] множитель HP кампании (1 = без изменений)
     */
    constructor(scene, difficulty, bossesKilled, playerPos, opts = {}) {
        const THREE = window.THREE;
        this.scene = scene;
        this.difficulty = difficulty;
        this.bossesKilled = bossesKilled;
        this.missionHpMultiplier = typeof opts.missionHpMultiplier === 'number' ? opts.missionHpMultiplier : 1;
        /** Режим кампании: HP = CAMPAIGN_BOSS_BASE_HP × миссия × сложность */
        this.useCampaignBossHp = !!opts.useCampaignBossHp;

        this.maxHp = this._calculateHp();
        this.hp = this.maxHp;
        this.currentPhase = 'PHASE_1';

        this.type = 'boss';
        this.state = BossState.ENTERING;
        this.isDead = false;
        this.fireTimer = 0;
        this.moveTimer = 0;
        this.gameTime = 0;
        
        /** Множитель скорости пуль (assist на Hard) */
        this.bulletSpeedMultiplier = 1;

        /** Не стрелять первые N секунд после респавна */
        this.attackHoldRemaining = 0;

        /** Мировая позиция в момент смерти (меш снимается сразу, для dropPosition и т.п.) */
        this.deathOrigin = null;

        /** Счётчик мигания при уроне (отмена устаревших таймеров) */
        this._hitFlashToken = 0;

        /** Материал запасного куба (если OBJ/MTL не загрузились) */
        this.originalMaterial = null;

        this._initMesh(playerPos);
        this.updatePhaseVisuals();
    }

    /**
     * Абсолютный базовый URL каталога Boss/ (model.obj, model.mtl, текстуры) — от документа страницы.
     * @returns {string}
     */
    _bossAssetBaseUrl() {
        const dir = BossConfig.BOSS_ASSET_DIR || 'Boss/';
        try {
            return new URL(dir, window.location.href).href;
        } catch (e) {
            console.warn('[Boss] BOSS_ASSET_DIR URL resolve failed, using raw path', e);
            return dir;
        }
    }

    _calculateHp() {
        if (this.useCampaignBossHp) {
            const base = BossConfig.CAMPAIGN_BOSS_BASE_HP;
            const diffMult =
                BossConfig.CAMPAIGN_DIFFICULTY_HP_MULT[this.difficulty] ??
                BossConfig.CAMPAIGN_DIFFICULTY_HP_MULT.medium;
            return Math.floor(base * this.missionHpMultiplier * diffMult);
        }
        const base = BossConfig.BOSS_BASE_HP + this.bossesKilled * BossConfig.BOSS_HP_PER_KILL;
        const mult = BossConfig.HP_MULTIPLIER[this.difficulty] ?? 1.5;
        return Math.floor(base * mult * this.missionHpMultiplier);
    }

    _initMesh(playerPos) {
        const THREE = window.THREE;
        this.hitFlashMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            flatShading: true,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });

        this.mesh = new THREE.Group();
        this.mesh.position.set(0, 30, playerPos.z - 150);
        this.scene.add(this.mesh);

        this._addEngineGlow(THREE);

        const loadersReady = typeof THREE.MTLLoader === 'function' && typeof THREE.OBJLoader === 'function';
        if (!loadersReady) {
            console.error('[Boss] THREE.MTLLoader / THREE.OBJLoader not available, using fallback box');
            this._initFallbackBoxHull(THREE);
            return;
        }

        const assetBase = this._bossAssetBaseUrl();
        const mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath(assetBase);
        mtlLoader.load(
            'model.mtl',
            (materials) => {
                materials.preload();
                if (!this.mesh || this.isDead) return;
                const objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath(assetBase);
                objLoader.load(
                    'model.obj',
                    (object) => {
                        if (!this.mesh || this.isDead) {
                            object.traverse((child) => {
                                if (child.geometry) child.geometry.dispose();
                                if (child.material) {
                                    const m = child.material;
                                    if (Array.isArray(m)) m.forEach((x) => x.dispose && x.dispose());
                                    else if (m.dispose) m.dispose();
                                }
                            });
                            return;
                        }
                        this._stripNonGlowChildren(THREE);
                        this._applyBossObjTransformAndMount(THREE, object);
                        this._syncEngineGlowToModel(THREE, object);
                        console.log('[Boss] OBJ model mounted from', assetBase);
                    },
                    undefined,
                    (err) => {
                        console.error('[Boss] Failed to load Boss/model.obj', err);
                        if (this.mesh && !this.isDead) this._initFallbackBoxHull(THREE);
                    }
                );
            },
            undefined,
            (err) => {
                console.error('[Boss] Failed to load Boss/model.mtl', err);
                if (this.mesh && !this.isDead) this._initFallbackBoxHull(THREE);
            }
        );
    }

    /**
     * Снимает с корня всё кроме подсветки (модель или старый fallback).
     * @param {typeof import('three')} THREE
     */
    _stripNonGlowChildren(THREE) {
        if (!this.mesh) return;
        for (let i = this.mesh.children.length - 1; i >= 0; i--) {
            const c = this.mesh.children[i];
            if (c.userData && c.userData.isBossGlow) continue;
            this.mesh.remove(c);
            c.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    const m = child.material;
                    const list = Array.isArray(m) ? m : [m];
                    for (const mat of list) {
                        if (!mat || mat === this.hitFlashMaterial || mat === this.engineGlow || mat === this.originalMaterial)
                            continue;
                        mat.dispose();
                    }
                }
            });
        }
    }

    /**
     * @param {typeof import('three')} THREE
     */
    _addEngineGlow(THREE) {
        const glowGeom = new THREE.SphereGeometry(2, 8, 8);
        this.engineGlow = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.8 });
        const glowMesh = new THREE.Mesh(glowGeom, this.engineGlow);
        glowMesh.userData.isBossGlow = true;
        const axis = BossConfig.BOSS_MODEL_TARGET_MAX_AXIS ?? 14;
        glowMesh.position.set(0, 0, Math.max(4, axis * 0.35));
        this.mesh.add(glowMesh);
    }

    /**
     * Запасной корпус как раньше (один Mesh с PhongMaterial).
     * @param {typeof import('three')} THREE
     */
    _initFallbackBoxHull(THREE) {
        this._stripNonGlowChildren(THREE);
        if (!this.originalMaterial) {
            this.originalMaterial = new THREE.MeshPhongMaterial({
                color: 0x2c3e50,
                flatShading: true,
                emissive: 0xffffff,
                emissiveIntensity: 0
            });
        }
        const geom = new THREE.BoxGeometry(12, 5, 8);
        const hull = new THREE.Mesh(geom, this.originalMaterial);
        hull.castShadow = true;
        this.mesh.add(hull);
    }

    /**
     * @param {typeof import('three')} THREE
     * @param {import('three').Group} object
     */
    _applyBossObjTransformAndMount(THREE, object) {
        const doubleSided = BossConfig.BOSS_MODEL_DOUBLE_SIDED !== false;
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.frustumCulled = true;
                if (doubleSided && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    for (const m of mats) {
                        if (m && 'side' in m) m.side = THREE.DoubleSide;
                    }
                }
            }
        });

        object.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        object.position.sub(center);

        const targetAxis = BossConfig.BOSS_MODEL_TARGET_MAX_AXIS ?? 14;
        const maxAxis = Math.max(size.x, size.y, size.z);
        if (maxAxis > 1e-6) {
            object.scale.setScalar(targetAxis / maxAxis);
        }
        object.rotation.set(
            BossConfig.BOSS_MODEL_ROT_X ?? 0,
            BossConfig.BOSS_MODEL_ROT_Y ?? 0,
            BossConfig.BOSS_MODEL_ROT_Z ?? 0
        );

        this.mesh.add(object);
    }

    /**
     * Сдвиг сферы двигателя к «корме» по локальному AABB модели (после масштаба и поворота).
     * @param {typeof import('three')} THREE
     * @param {import('three').Object3D} modelRoot
     */
    _syncEngineGlowToModel(THREE, modelRoot) {
        if (!this.mesh) return;
        let glowMesh = null;
        this.mesh.traverse((c) => {
            if (c.userData && c.userData.isBossGlow) glowMesh = c;
        });
        if (!glowMesh) return;

        modelRoot.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        glowMesh.position.set(0, 0, Math.max(2.5, maxDim * 0.42 + 1.5));
    }

    flashHit() {
        this.visualHitEffect();
        this.audioHitEffect();
    }

    visualHitEffect() {
        if (!this.mesh) return;

        // 1. Мигание красным (0.1 сек): обход всех Mesh, кроме подсветки двигателя
        const token = ++this._hitFlashToken;
        const saved = [];
        this.mesh.traverse((child) => {
            if (!child.isMesh || (child.userData && child.userData.isBossGlow)) return;
            saved.push({ child, material: child.material });
            if (Array.isArray(child.material)) {
                child.material = child.material.map(() => this.hitFlashMaterial);
            } else {
                child.material = this.hitFlashMaterial;
            }
        });
        setTimeout(() => {
            if (token !== this._hitFlashToken || !this.mesh) return;
            for (const { child, material } of saved) {
                if (child.material !== undefined) child.material = material;
            }
        }, 100);

        // 2. Частицы искр (sprite particles as requested)
        this.spawnHitParticles();

        // 3. Тряска камеры (при фазе 3)
        if (this.currentPhase === 'PHASE_3') {
            this.shakeCamera();
        }
    }

    spawnHitParticles() {
        const THREE = window.THREE;
        const particleCount = 12;
        const textureLoader = new THREE.TextureLoader();
        // Используем стандартную точку или создаем холст, если текстуры нет
        // Для простоты создадим маленькую белую точку через CanvasTexture
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);

        for (let i = 0; i < particleCount; i++) {
            const material = new THREE.SpriteMaterial({ map: texture, color: 0xffaa00, transparent: true });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(0.5, 0.5, 0.5);
            
            // Позиция - чуть впереди меша
            sprite.position.copy(this.mesh.position);
            sprite.position.x += (Math.random() - 0.5) * 5;
            sprite.position.y += (Math.random() - 0.5) * 2;
            sprite.position.z += 4;

            this.scene.add(sprite);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            const startTime = performance.now();
            const duration = 500;

            const animateParticle = (time) => {
                const elapsed = time - startTime;
                if (elapsed > duration) {
                    this.scene.remove(sprite);
                    return;
                }
                sprite.position.addScaledVector(velocity, 0.016);
                material.opacity = 1 - (elapsed / duration);
                requestAnimationFrame(animateParticle);
            };
            requestAnimationFrame(animateParticle);
        }
    }

    shakeCamera() {
        window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.2, duration: 100 } })); // Lowered intensity/duration
    }

    audioHitEffect() {
        const sounds = {
            'PHASE_1': 'boss_hit_light',
            'PHASE_2': 'boss_hit_medium',
            'PHASE_3': 'boss_hit_heavy'
        };
        AudioManager.play(sounds[this.currentPhase] || 'boss_hit_light');
    }

    updatePhase() {
        const hpPercent = this.hp / this.maxHp;
        const previousPhase = this.currentPhase;

        if (hpPercent <= 0.4) {
            this.currentPhase = 'PHASE_3';
        } else if (hpPercent <= 0.7) {
            this.currentPhase = 'PHASE_2';
        } else {
            this.currentPhase = 'PHASE_1';
        }

        if (this.currentPhase !== previousPhase) {
            AudioManager.play('phase_change');
            window.dispatchEvent(new CustomEvent('boss-phase-change', { detail: { phase: this.currentPhase } }));
            this.updatePhaseVisuals();
        }
    }

    updatePhaseVisuals() {
        const colors = {
            'PHASE_1': 0x00d4ff, // Синий
            'PHASE_2': 0xff6b35, // Оранжевый
            'PHASE_3': 0xff0000  // Красный
        };
        
        if (this.engineGlow) {
            this.engineGlow.color.setHex(colors[this.currentPhase]);
        }
    }

    /**
     * @param {number} seconds — задержка атаки после респавна
     */
    setAttackHold(seconds) {
        this.attackHoldRemaining = Math.max(this.attackHoldRemaining, seconds);
    }

    update(dt, playerPos, gameTime) {
        if (this.isDead) return;
        this.gameTime = gameTime;

        if (this.state === BossState.ENTERING) {
            const targetZ = playerPos.z - 70;
            const targetY = 30;
            this.mesh.position.z += (targetZ - this.mesh.position.z) * 1.5 * dt;
            this.mesh.position.y += (targetY - this.mesh.position.y) * dt;

            if (Math.abs(this.mesh.position.z - targetZ) < 5) {
                if (this.state === BossState.ENTERING) {
                    window.dispatchEvent(new CustomEvent('boss-warning-hide'));
                }
                this.state = BossState.ACTIVE;
            }
        } else if (this.state === BossState.ACTIVE) {
            this.mesh.position.z = playerPos.z - 70;
            
            // Movement pattern
            if (this.currentPhase === 'PHASE_3') {
                this.mesh.position.x = Math.sin(this.gameTime * 0.8) * 35;
                this.mesh.position.y = 30 + Math.cos(this.gameTime * 1.2) * 5;
            } else {
                this.mesh.position.x = Math.sin(this.gameTime * 0.5) * 25;
            }

            if (this.attackHoldRemaining > 0) {
                this.attackHoldRemaining -= dt;
            } else {
                this.fireTimer += dt;
                this.moveTimer += dt;
                
                this.executeAttacks(dt, playerPos);
            }
        } else if (this.state === BossState.LEAVING) {
            this.mesh.position.z -= 100 * dt;
            this.mesh.position.y += 50 * dt;
        }
    }

    executeAttacks(dt, playerPos) {
        let fireRate = 1.0;
        let patternRate = 7.0;

        switch (this.currentPhase) {
            case 'PHASE_1':
                fireRate = this.difficulty === 'hard' ? 0.6 : 0.9;
                if (this.fireTimer > fireRate) {
                    this._shoot(playerPos, 'normal');
                    this.fireTimer = 0;
                }
                if (this.moveTimer > patternRate) {
                    this._shoot(playerPos, 'missile');
                    this.moveTimer = 0;
                }
                break;
            case 'PHASE_2':
                fireRate = this.difficulty === 'hard' ? 0.5 : 0.8;
                if (this.fireTimer > fireRate) {
                    this._shoot(playerPos, 'pattern'); // Fan fire
                    this.fireTimer = 0;
                }
                if (this.moveTimer > 5.0) {
                    this._shoot(playerPos, 'mine');
                    this.moveTimer = 0;
                }
                break;
            case 'PHASE_3':
                fireRate = this.difficulty === 'hard' ? 0.4 : 0.6;
                if (this.fireTimer > fireRate) {
                    this._shoot(playerPos, 'normal');
                    this.fireTimer = 0;
                }
                if (this.moveTimer > 3.0) {
                    const rand = Math.random();
                    if (rand < 0.3) this._shoot(playerPos, 'laser');
                    else if (rand < 0.6) this._shoot(playerPos, 'drone');
                    else this._shoot(playerPos, 'pattern');
                    this.moveTimer = 0;
                }
                break;
        }
    }

    takeDamage(dmg) {
        if (this.isDead || this.state !== BossState.ACTIVE) return false;

        this.hp -= dmg;
        
        // Визуальные и звуковые эффекты при попадании
        this.flashHit();
        
        // Проверка смены фазы
        this.updatePhase();

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.state = BossState.DESTROYED;
            return true;
        }
        return false;
    }

    /**
     * Взрыв при уничтожении: корпус сразу снимается со сцены (игрок движется — иначе «пролёт мимо»), частицы в точке гибели.
     * @param {() => void} onComplete
     */
    playDestructionExplosion(onComplete) {
        if (!this.mesh) {
            if (onComplete) onComplete();
            return;
        }

        const origin = this.mesh.position.clone();
        this.deathOrigin = origin.clone();

        this._spawnDeathBurst(origin);
        spawnDeathExplosion(this.scene, origin, 'boss');
        window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 2.5, duration: 520 } }));

        const meshToRemove = this.mesh;
        this.mesh = null;
        this.scene.remove(meshToRemove);
        this._disposeBossVisualResources(meshToRemove);

        const doneDelay = 750;
        setTimeout(() => {
            if (onComplete) onComplete();
        }, doneDelay);
    }

    /**
     * @param {import('three').Vector3} basePosition
     */
    _spawnDeathBurst(basePosition) {
        const THREE = window.THREE;
        const particleCount = 28;
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255,220,120,1)');
        gradient.addColorStop(0.4, 'rgba(255,120,40,0.9)');
        gradient.addColorStop(1, 'rgba(255,40,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);

        const base = basePosition.clone();
        for (let i = 0; i < particleCount; i++) {
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: Math.random() > 0.4 ? 0xff6600 : 0xffcc33,
                transparent: true
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(1.2 + Math.random(), 1.2 + Math.random(), 1);
            sprite.position.copy(base);
            sprite.position.x += (Math.random() - 0.5) * 8;
            sprite.position.y += (Math.random() - 0.5) * 4;
            sprite.position.z += (Math.random() - 0.5) * 8;
            this.scene.add(sprite);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 22,
                (Math.random() - 0.5) * 18,
                (Math.random() - 0.5) * 22
            );
            const t0 = performance.now();
            const life = 650 + Math.random() * 200;

            const anim = (time) => {
                const elapsed = time - t0;
                if (elapsed > life) {
                    this.scene.remove(sprite);
                    material.dispose();
                    return;
                }
                sprite.position.addScaledVector(velocity, 0.018);
                material.opacity = Math.max(0, 1 - elapsed / life);
                requestAnimationFrame(anim);
            };
            requestAnimationFrame(anim);
        }
    }

    _shoot(playerPos, type = 'normal') {
        window.dispatchEvent(
            new CustomEvent('boss-shoot', {
                detail: {
                    position: this.mesh.position.clone(),
                    target: playerPos.clone(),
                    type: type,
                    speedMultiplier: this.bulletSpeedMultiplier
                }
            })
        );
    }

    cleanup() {
        if (!this.mesh) return;
        const root = this.mesh;
        this.mesh = null;
        this.scene.remove(root);
        this._disposeBossVisualResources(root);
    }

    /**
     * Геометрии и материалы загруженной модели; общие материалы босса — один раз в конце.
     * @param {import('three').Object3D} meshRoot
     */
    _disposeBossVisualResources(meshRoot) {
        meshRoot.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                const arr = Array.isArray(child.material) ? child.material : [child.material];
                for (const m of arr) {
                    if (!m) continue;
                    if (m === this.hitFlashMaterial || m === this.engineGlow || m === this.originalMaterial) continue;
                    m.dispose();
                }
            }
        });
        if (this.hitFlashMaterial) {
            this.hitFlashMaterial.dispose();
            this.hitFlashMaterial = null;
        }
        if (this.engineGlow) {
            this.engineGlow.dispose();
            this.engineGlow = null;
        }
        if (this.originalMaterial) {
            this.originalMaterial.dispose();
            this.originalMaterial = null;
        }
    }
}
