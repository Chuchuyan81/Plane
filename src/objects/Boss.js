import { BossState } from '../core/GameState.js';
import { BossConfig } from '../config/BossConfig.js';

const THREE = window.THREE;

export class Boss {
    constructor(scene, difficulty, bossesKilled, playerPos) {
        this.scene = scene;
        this.difficulty = difficulty;
        this.bossesKilled = bossesKilled;

        this.maxHp = this._calculateHp();
        this.hp = this.maxHp;

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
    }

    _calculateHp() {
        const base = BossConfig.BOSS_BASE_HP + this.bossesKilled * BossConfig.BOSS_HP_PER_KILL;
        const mult = BossConfig.HP_MULTIPLIER[this.difficulty] ?? 1.5;
        return Math.floor(base * mult);
    }

    _initMesh(playerPos) {
        const geom = new THREE.BoxGeometry(12, 5, 8);
        const mat = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50, 
            flatShading: true,
            emissive: 0xffffff,
            emissiveIntensity: 0
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, 30, playerPos.z - 150);
        this.scene.add(this.mesh);
    }

    flashHit() {
        if (!this.mesh || !this.mesh.material) return;
        
        const mat = this.mesh.material;
        mat.emissive.set(0xff0000);
        mat.emissiveIntensity = 1.0;
        
        setTimeout(() => {
            if (mat) {
                mat.emissive.set(0xffffff);
                mat.emissiveIntensity = 0;
            }
        }, 100);
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
            this.mesh.position.x = Math.sin(this.gameTime * 0.5) * 25;

            if (this.attackHoldRemaining > 0) {
                this.attackHoldRemaining -= dt;
            } else {
                this.fireTimer += dt;
                this.moveTimer += dt;

                const fireRate = this.difficulty === 'hard' ? 0.35 : this.difficulty === 'medium' ? 0.5 : 0.7;

                if (this.fireTimer > fireRate) {
                    this._shoot(playerPos);
                    this.fireTimer = 0;
                }

                if (this.moveTimer > 5.0) {
                    this._shootPattern(playerPos);
                    this.moveTimer = 0;
                }
            }
        } else if (this.state === BossState.LEAVING) {
            this.mesh.position.z -= 100 * dt;
            this.mesh.position.y += 50 * dt;
        }
    }

    takeDamage(dmg) {
        if (this.isDead || this.state !== BossState.ACTIVE) return false;

        this.hp -= dmg;
        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.isDead = true;
        this.state = BossState.DESTROYED;
    }

    _shoot(playerPos) {
        window.dispatchEvent(
            new CustomEvent('boss-shoot', {
                detail: {
                    position: this.mesh.position.clone(),
                    target: playerPos.clone(),
                    type: 'normal',
                    speedMultiplier: this.bulletSpeedMultiplier
                }
            })
        );
    }

    _shootPattern(playerPos) {
        window.dispatchEvent(
            new CustomEvent('boss-shoot', {
                detail: {
                    position: this.mesh.position.clone(),
                    target: playerPos.clone(),
                    type: 'pattern',
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
