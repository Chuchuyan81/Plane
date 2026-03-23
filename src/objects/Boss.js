import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { BossState } from '../core/GameState.js';

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

        this._initMesh(playerPos);
    }

    _calculateHp() {
        let baseHp = 100 + this.bossesKilled * 50;
        const multipliers = {
            easy: 1.0,
            medium: 1.5,
            hard: 2.2
        };
        return Math.floor(baseHp * (multipliers[this.difficulty] || 1.5));
    }

    _initMesh(playerPos) {
        const geom = new THREE.BoxGeometry(12, 5, 8);
        const mat = new THREE.MeshPhongMaterial({ color: 0x2c3e50, flatShading: true });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, 30, playerPos.z - 150);
        this.scene.add(this.mesh);
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
                this.state = BossState.ACTIVE;
            }
        } else if (this.state === BossState.ACTIVE) {
            this.mesh.position.z = playerPos.z - 70;
            this.mesh.position.x = Math.sin(this.gameTime * 0.5) * 25;
            
            this.fireTimer += dt;
            this.moveTimer += dt;

            const fireRate = this.difficulty === 'hard' ? 0.35 : (this.difficulty === 'medium' ? 0.5 : 0.7);
            
            if (this.fireTimer > fireRate) {
                this._shoot(playerPos);
                this.fireTimer = 0;
            }
            
            if (this.moveTimer > 5.0) {
                this._shootPattern(playerPos);
                this.moveTimer = 0;
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
        // Logic for death (particles, etc.) should be handled by manager or in index.html
    }

    _shoot(playerPos) {
        // Trigger event or callback for shooting
        const event = new CustomEvent('boss-shoot', {
            detail: {
                position: this.mesh.position.clone(),
                target: playerPos.clone(),
                type: 'normal'
            }
        });
        window.dispatchEvent(event);
    }

    _shootPattern(playerPos) {
        const event = new CustomEvent('boss-shoot', {
            detail: {
                position: this.mesh.position.clone(),
                target: playerPos.clone(),
                type: 'pattern'
            }
        });
        window.dispatchEvent(event);
    }

    cleanup() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}
