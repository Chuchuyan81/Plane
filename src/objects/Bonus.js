export class Bonus {
    /**
     * @param {object} scene
     * @param {string} type
     * @param {import('three').Vector3} position
     * @param {() => import('three').Vector3} getPlayerPosition
     * @param {object} [options]
     * @param {number} [options.speed] скорость полёта к игроку
     * @param {number} [options.reachDist]
     * @param {number} [options.maxLife] таймаут без подбора (сек)
     */
    constructor(scene, type, position, getPlayerPosition, options = {}) {
        const THREE = window.THREE;
        this.scene = scene;
        this.type = type;
        this.isDead = false;
        this.getPlayerPosition = getPlayerPosition;
        this.speed = options.speed ?? 140;
        this.reachDist = options.reachDist ?? 2.5;
        this.maxLife = options.maxLife ?? 12;
        this.life = 0;
        this.onReach = options.onReach;

        const colors = {
            shield: 0x0088ff,
            repair: 0x00ff88,
            speed: 0xffff00,
            multishot: 0xff8800,
            weapon_damage: 0xff0044,
            weapon_rate: 0x8844ff
        };
        const emissiveColor = colors[this.type] || 0xffffff;

        this.mesh = new THREE.Mesh(
            this._getGeometry(type),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: emissiveColor,
                emissiveIntensity: 0.8,
                metalness: 0.5,
                roughness: 0.2,
                flatShading: true
            })
        );
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    _getGeometry(type) {
        switch (type) {
            case 'repair':
                return new window.THREE.BoxGeometry(1.5, 1.5, 1.5);
            case 'weapon_damage':
                return new window.THREE.TorusGeometry(1, 0.4, 8, 16);
            case 'weapon_rate':
                return new window.THREE.ConeGeometry(1, 2, 8);
            default:
                return new window.THREE.OctahedronGeometry(1.5);
        }
    }

    update(dt) {
        if (this.isDead) return;

        this.life += dt;
        if (this.life > this.maxLife) {
            this.cleanup();
            return;
        }

        const target = this.getPlayerPosition();
        if (!target) return;

        const dir = new window.THREE.Vector3().subVectors(target, this.mesh.position);
        const dist = dir.length();
        if (dist <= this.reachDist) {
            if (typeof this.onReach === 'function') {
                this.onReach(this.type);
            }
            this.cleanup();
            return;
        }
        dir.normalize();
        const step = Math.min(this.speed * dt, dist - this.reachDist * 0.5);
        this.mesh.position.addScaledVector(dir, step);

        const pulseTime = Date.now() * 0.001;
        this.mesh.material.emissiveIntensity = 0.5 + Math.sin(pulseTime * 12.56) * 0.5;
        this.mesh.rotation.y += 2.0 * dt;
    }

    cleanup() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            this.mesh = null;
        }
        this.isDead = true;
    }
}
