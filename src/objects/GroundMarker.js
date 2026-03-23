/**
 * Наземный маркер дистанции
 */
const THREE = window.THREE;

export class GroundMarker {
    constructor() {
        this.group = new THREE.Group();
        this.isVisible = false;
        
        // Создаем геометрию для маркера (плоскость на земле)
        const planeGeom = new THREE.PlaneGeometry(15, 3);
        this.planeMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide,
            fog: false
        });
        this.plane = new THREE.Mesh(planeGeom, this.planeMat);
        this.plane.rotation.x = -Math.PI / 2;
        this.group.add(this.plane);

        // Текст через CanvasTexture
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 128;
        this.context = this.canvas.getContext('2d');
        
        this.texture = new THREE.CanvasTexture(this.canvas);
        const spriteMat = new THREE.SpriteMaterial({ 
            map: this.texture, 
            transparent: true,
            fog: false
        });
        this.sprite = new THREE.Sprite(spriteMat);
        this.sprite.position.y = 1; 
        this.sprite.renderOrder = 999; 
        this.sprite.scale.set(30, 7.5, 1);
        this.group.add(this.sprite);

        // Для чек-поинтов
        this.starGroup = new THREE.Group();
        this.starGroup.visible = false;
        this.group.add(this.starGroup);
        
        const starGeom = new THREE.OctahedronGeometry(4, 0); 
        this.starMat = new THREE.MeshPhongMaterial({ 
            color: 0xffd700, 
            emissive: 0xffd700, 
            emissiveIntensity: 1.5,
            fog: false
        });
        this.star = new THREE.Mesh(starGeom, this.starMat);
        this.star.position.y = 10;
        this.star.renderOrder = 1000;
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
            this.planeMat.opacity = 0.3;
            this.plane.scale.set(1, 1, 1);
        }

        // Обновляем текст на канвасе
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.context.fillStyle = isCheckpoint ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); 
        
        this.context.fillStyle = isCheckpoint ? '#ffd700' : '#ffffff'; 
        this.context.font = 'bold 80px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        
        let text = `${distance} м`;
        if (isCheckpoint) text = `★ ${distance} м ★`;
        
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
