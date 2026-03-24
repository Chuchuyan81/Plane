/**
 * Наземный маркер дистанции
 */
export class GroundMarker {
    constructor() {
        const THREE = window.THREE;
        this.group = new THREE.Group();
        this.isVisible = false;
        
        // Основная полоса (метка на земле)
        const planeGeom = new THREE.PlaneGeometry(12, 1.5);
        this.planeMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.4,
            side: THREE.DoubleSide,
            fog: false
        });
        this.plane = new THREE.Mesh(planeGeom, this.planeMat);
        this.plane.rotation.x = -Math.PI / 2;
        this.group.add(this.plane);

        // Свечение для чек-поинта (подложка)
        const glowGeom = new THREE.PlaneGeometry(25, 25);
        this.glowMat = new THREE.MeshBasicMaterial({
            map: this._createGlowTexture(),
            color: 0xffd700,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false
        });
        this.glow = new THREE.Mesh(glowGeom, this.glowMat);
        this.glow.rotation.x = -Math.PI / 2;
        this.glow.position.y = 0.1;
        this.group.add(this.glow);

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
        this.sprite.position.y = 4; 
        this.sprite.renderOrder = 100; 
        this.sprite.scale.set(25, 6.25, 1);
        this.group.add(this.sprite);

        // Звезда ★
        this.starGroup = new THREE.Group();
        this.starGroup.visible = false;
        this.group.add(this.starGroup);
        
        const starGeom = new THREE.OctahedronGeometry(3, 0); 
        this.starMat = new THREE.MeshPhongMaterial({ 
            color: 0xffd700, 
            emissive: 0xffd700, 
            emissiveIntensity: 1.5,
            fog: false
        });
        this.star = new THREE.Mesh(starGeom, this.starMat);
        this.star.position.y = 12;
        this.star.renderOrder = 101;
        this.starGroup.add(this.star);

        this.isCheckpoint = false;
        this.pulseTimer = 0;
    }

    /**
     * Создание текстуры радиального градиента для свечения
     * @private
     */
    _createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Настройка маркера
     * @param {number} distance - дистанция
     * @param {boolean} isCheckpoint - является ли чек-поинтом
     */
    setup(distance, isCheckpoint) {
        this.isCheckpoint = isCheckpoint;
        this.starGroup.visible = isCheckpoint;
        this.glowMat.opacity = isCheckpoint ? 0.6 : 0;
        
        if (isCheckpoint) {
            this.planeMat.color.set(0xffd700);
            this.planeMat.opacity = 0.8;
            this.plane.scale.set(2, 2, 1);
        } else {
            this.planeMat.color.set(0xffffff);
            this.planeMat.opacity = 0.3;
            this.plane.scale.set(1, 1, 1);
        }

        // Обновляем текст на канвасе
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем подложку текста (скругленный прямоугольник)
        this.context.fillStyle = isCheckpoint ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        const x = 64, y = 32, w = 384, h = 64, r = 32;
        this.context.beginPath();
        this.context.moveTo(x + r, y);
        this.context.lineTo(x + w - r, y);
        this.context.quadraticCurveTo(x + w, y, x + w, y + r);
        this.context.lineTo(x + w, y + h - r);
        this.context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.context.lineTo(x + r, y + h);
        this.context.quadraticCurveTo(x, y + h, x, y + h - r);
        this.context.lineTo(x, y + r);
        this.context.quadraticCurveTo(x, y, x + r, y);
        this.context.closePath();
        this.context.fill();
        
        this.context.fillStyle = isCheckpoint ? '#ffd700' : '#ffffff'; 
        this.context.font = 'bold 70px Arial';
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
            this.starMat.emissiveIntensity = 1.0 + Math.sin(this.pulseTimer) * 0.5;
            this.glow.scale.set(s, s, s);
            this.glowMat.opacity = 0.4 + Math.sin(this.pulseTimer) * 0.2;
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
