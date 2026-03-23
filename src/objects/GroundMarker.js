/**
 * Наземный маркер дистанции
 */
const THREE = window.THREE;

export class GroundMarker {
    constructor() {
        this.group = new THREE.Group();
        this.isVisible = false;
        
        // Создаем геометрию для маркера (плоскость на земле)
        const planeGeom = new THREE.PlaneGeometry(10, 2);
        this.planeMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.plane = new THREE.Mesh(planeGeom, this.planeMat);
        this.plane.rotation.x = -Math.PI / 2;
        this.group.add(this.plane);

        // Текст будет реализован через CanvasTexture для простоты
        this.canvas = document.createElement('canvas');
        this.canvas.width = 256;
        this.canvas.height = 64;
        this.context = this.canvas.getContext('2d');
        
        this.texture = new THREE.CanvasTexture(this.canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
        this.sprite = new THREE.Sprite(spriteMat);
        this.sprite.position.y = 2; // Относительно группы (которая будет на -19.9)
        this.sprite.scale.set(20, 5, 1);
        this.group.add(this.sprite);

        // Для чек-поинтов
        this.starGroup = new THREE.Group();
        this.starGroup.visible = false;
        this.group.add(this.starGroup);
        
        // Звезда ★ (упрощенно - 2 треугольника или Octahedron)
        const starGeom = new THREE.OctahedronGeometry(2, 0);
        this.starMat = new THREE.MeshPhongMaterial({ 
            color: 0xffd700, 
            emissive: 0xffd700, 
            emissiveIntensity: 0.5 
        });
        this.star = new THREE.Mesh(starGeom, this.starMat);
        this.star.position.y = 5; // Относительно группы
        this.starGroup.add(this.star);

        this.isCheckpoint = false;
        this.pulseTimer = 0;
    }

    /**
     * Настройка маркера
     * @param {number} distance - дистанция
     * @param {boolean} isCheckpoint - является ли чек-поинтом
     */
    setup(distance, isCheckpoint) {
        this.isCheckpoint = isCheckpoint;
        this.starGroup.visible = isCheckpoint;
        
        if (isCheckpoint) {
            this.planeMat.color.set(0xffd700);
            this.planeMat.opacity = 0.8;
            this.plane.scale.set(1.5, 1.5, 1);
        } else {
            this.planeMat.color.set(0xffffff);
            this.planeMat.opacity = 0.4;
            this.plane.scale.set(1, 1, 1);
        }

        // Обновляем текст на канвасе
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = isCheckpoint ? '#ffd700' : '#ffffff';
        this.context.font = 'bold 40px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        
        let text = `${distance} м`;
        if (isCheckpoint) text = `★ ${text} ★`;
        
        this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        this.texture.needsUpdate = true;
    }

    update(dt) {
        if (this.isCheckpoint) {
            this.pulseTimer += dt * 3;
            const s = 1 + Math.sin(this.pulseTimer) * 0.2;
            this.star.scale.set(s, s, s);
            this.star.rotation.y += dt * 2;
            this.starMat.emissiveIntensity = 0.5 + Math.sin(this.pulseTimer) * 0.3;
        }
    }

    get mesh() {
        return this.group;
    }

    set visible(val) {
        this.group.visible = val;
        this.isVisible = val;
    }

    get visible() {
        return this.isVisible;
    }
}
