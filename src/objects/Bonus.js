export class Bonus {
    constructor(scene, type, position) {
        const THREE = window.THREE;
        this.scene = scene;
        this.type = type;
        this.isDead = false;

        const colors = {
            'shield': 0x0088FF,
            'repair': 0x00FF88,
            'speed': 0xFFFF00,
            'multishot': 0xFF8800,
            'weapon_damage': 0xFF0044,
            'weapon_rate': 0x8844FF
        };
        const emissiveColor = colors[this.type] || 0xFFFFFF;

        // Используем те же геометрии, что и в index.html для совместимости
        // Но здесь мы создаем их, если они не переданы
        this.mesh = new THREE.Mesh(
            this._getGeometry(type),
            new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
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
        // Повторяем логику из index.html
        switch(type) {
            case 'repair': return new THREE.BoxGeometry(1.5, 1.5, 1.5);
            case 'weapon_damage': return new THREE.TorusGeometry(1, 0.4, 8, 16);
            case 'weapon_rate': return new THREE.ConeGeometry(1, 2, 8);
            default: return new THREE.OctahedronGeometry(1.5);
        }
    }

    update(dt, gameTime) {
        if (this.isDead) return;

        // Движение (из index.html)
        this.mesh.position.z += 10 * dt;

        // Пульсация свечения (ТЗ Задача 2: частота ~2 Гц)
        // Частота 2 Гц означает 2 полных цикла в секунду.
        // Math.sin(time * speed) — один цикл при speed * time = 2 * PI.
        // Для 2 циклов в сек: speed * 1 = 2 * (2 * PI) = 4 * PI.
        // 4 * PI ≈ 12.56.
        const pulseTime = Date.now() * 0.001; // время в секундах
        this.mesh.material.emissiveIntensity = 0.5 + Math.sin(pulseTime * 12.56) * 0.5;

        // Вращение (ТЗ Задача 2: скорость ~2 радиан/сек)
        this.mesh.rotation.y += 2.0 * dt;
    }

    cleanup() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        this.isDead = true;
    }
}
