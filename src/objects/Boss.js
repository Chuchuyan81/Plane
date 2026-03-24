import { BossState } from '../core/GameState.js';
import { BossConfig } from '../config/BossConfig.js';
import AudioManager from '../core/AudioManager.js';

export class Boss {
    constructor(scene, difficulty, bossesKilled, playerPos) {
        const THREE = window.THREE;
        this.scene = scene;
        this.difficulty = difficulty;
        this.bossesKilled = bossesKilled;

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

        this._initMesh(playerPos);
        this.updatePhaseVisuals();
    }

    _calculateHp() {
        const base = BossConfig.BOSS_BASE_HP + this.bossesKilled * BossConfig.BOSS_HP_PER_KILL;
        const mult = BossConfig.HP_MULTIPLIER[this.difficulty] ?? 1.5;
        return Math.floor(base * mult);
    }

    _initMesh(playerPos) {
        const THREE = window.THREE;
        const geom = new THREE.BoxGeometry(12, 5, 8);
        this.originalMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50, 
            flatShading: true,
            emissive: 0xffffff,
            emissiveIntensity: 0
        });
        this.hitFlashMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000, 
            flatShading: true,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });
        
        this.mesh = new THREE.Mesh(geom, this.originalMaterial);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, 30, playerPos.z - 150);
        this.scene.add(this.mesh);

        // Engine glow
        const glowGeom = new THREE.SphereGeometry(2, 8, 8);
        this.engineGlow = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.8 });
        const glowMesh = new THREE.Mesh(glowGeom, this.engineGlow);
        glowMesh.position.set(0, 0, 4); // Back of the boss
        this.mesh.add(glowMesh);
    }

    flashHit() {
        this.visualHitEffect();
        this.audioHitEffect();
    }

    visualHitEffect() {
        if (!this.mesh) return;

        // 1. Мигание красным (0.1 сек)
        this.mesh.material = this.hitFlashMaterial;
        setTimeout(() => {
            if (this.mesh) this.mesh.material = this.originalMaterial;
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
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.isDead = true;
        this.state = BossState.DESTROYED;
        AudioManager.play('boss_defeated');
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
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}
