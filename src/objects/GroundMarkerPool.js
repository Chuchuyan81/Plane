import { GroundMarker } from './GroundMarker.js';

/**
 * Пул наземных маркеров для оптимизации
 */
export class GroundMarkerPool {
    constructor(maxMarkers = 20) {
        this.pool = [];
        this.active = [];
        this.scene = null;
        
        // Предсоздание объектов
        for (let i = 0; i < maxMarkers; i++) {
            this.pool.push(new GroundMarker());
        }
    }

    /**
     * Инициализация
     * @param {THREE.Scene} scene - сцена
     */
    init(scene) {
        this.scene = scene;
        // Добавляем все маркеры в сцену заранее (скрытыми)
        [...this.pool, ...this.active].forEach(m => {
            m.visible = false;
            this.scene.add(m.mesh);
        });
    }

    /**
     * Появление маркера
     * @param {number} distance - дистанция (м)
     * @param {boolean} isCheckpoint - чек-поинт или нет
     */
    spawn(distance, isCheckpoint) {
        const marker = this.pool.pop() || new GroundMarker();
        if (this.scene && !marker.mesh.parent) this.scene.add(marker.mesh);
        
        marker.setup(distance, isCheckpoint);
        // В Three.js Z отрицательная для движения вперед
        marker.mesh.position.set(0, 0, -distance);
        marker.visible = true;
        this.active.push(marker);
        return marker;
    }

    /**
     * Очистка маркеров вне зоны видимости
     * @param {number} cameraZ - текущая Z камеры
     * @param {number} viewDistance - дальность видимости (м)
     */
    cull(cameraZ, viewDistance = 500) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const m = this.active[i];
            // Поскольку движение по отрицательной Z, разность (cameraZ - m.position.z) 
            // будет положительной, если маркер позади камеры
            const diff = m.mesh.position.z - cameraZ;
            
            // Если маркер позади камеры (diff > 50) или слишком далеко впереди
            if (diff > 50 || Math.abs(diff) > viewDistance) {
                m.visible = false;
                this.pool.push(m);
                this.active.splice(i, 1);
            }
        }
    }

    /**
     * Сброс всех маркеров
     */
    reset() {
        while (this.active.length > 0) {
            const m = this.active.pop();
            m.visible = false;
            this.pool.push(m);
        }
    }

    update(dt) {
        this.active.forEach(m => m.update(dt));
    }
}
