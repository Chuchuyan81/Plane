// src/ui/screens/BriefingScreen.js

class BriefingScreen {
  constructor() {
    this.container = document.getElementById('briefingScreen');
    this.missionTitle = document.getElementById('briefing-mission-title');
    this.missionNumber = document.getElementById('briefing-mission-number');
    this.briefingText = document.getElementById('briefing-text-content');
    this.enemyIntel = document.getElementById('enemy-intel-panel');
    this.sectorPreview = document.getElementById('sector-preview-container');
    
    this.btnBack = document.getElementById('briefing-btn-back');
    this.btnUpgrades = document.getElementById('briefing-btn-upgrades');
    this.btnStart = document.getElementById('briefing-btn-start');
    
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewMesh = null;
    this.animationId = null;
  }

  show(missionData, callbacks = {}) {
    if (!this.container || !missionData) return;
    
    this.renderContent(missionData);
    this.setupListeners(callbacks);
    this.initPreview(missionData.environment);
    
    this.container.style.display = 'flex';
    this.container.classList.add('active');
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.container.classList.remove('active');
    }
    this.stopPreview();
  }

  renderContent(missionData) {
    this.missionNumber.textContent = `МИССИЯ #${missionData.id.toString().padStart(2, '0')}`;
    this.missionTitle.textContent = missionData.title;
    this.briefingText.innerHTML = missionData.briefingText;
    
    // Рендер разведданных
    this.enemyIntel.innerHTML = '';
    
    // Список врагов
    if (missionData.enemies && missionData.enemies.length) {
      missionData.enemies.forEach(enemy => {
        const item = document.createElement('div');
        item.className = 'intel-item';
        item.textContent = `ВРАГ: ${enemy}`;
        this.enemyIntel.appendChild(item);
      });
    }
    
    // Босс
    if (missionData.bossName) {
      const bossItem = document.createElement('div');
      bossItem.className = 'intel-item boss-intel';
      bossItem.style.borderLeftColor = '#f44336';
      bossItem.style.color = '#ff8a80';
      bossItem.innerHTML = `<strong>БОСС:</strong> ${missionData.bossName}`;
      this.enemyIntel.appendChild(bossItem);
    }

    // Награда
    const rewardItem = document.createElement('div');
    rewardItem.className = 'intel-item reward-intel';
    rewardItem.style.borderLeftColor = '#4caf50';
    rewardItem.innerHTML = `<strong>НАГРАДА:</strong> ${missionData.baseCredits} Кредитов`;
    this.enemyIntel.appendChild(rewardItem);
  }

  setupListeners(callbacks) {
    // Удаляем старые слушатели
    const newBtnBack = this.btnBack.cloneNode(true);
    const newBtnUpgrades = this.btnUpgrades.cloneNode(true);
    const newBtnStart = this.btnStart.cloneNode(true);
    
    this.btnBack.parentNode.replaceChild(newBtnBack, this.btnBack);
    this.btnUpgrades.parentNode.replaceChild(newBtnUpgrades, this.btnUpgrades);
    this.btnStart.parentNode.replaceChild(newBtnStart, this.btnStart);
    
    this.btnBack = newBtnBack;
    this.btnUpgrades = newBtnUpgrades;
    this.btnStart = newBtnStart;

    // Сбрасываем текст кнопок по умолчанию
    this.btnStart.textContent = 'В БОЙ!';
    this.btnBack.textContent = 'НАЗАД';

    if (callbacks.onBack) this.btnBack.addEventListener('click', callbacks.onBack);
    if (callbacks.onUpgrades) this.btnUpgrades.addEventListener('click', callbacks.onUpgrades);
    if (callbacks.onStart) this.btnStart.addEventListener('click', () => callbacks.onStart(callbacks.missionId));
  }

  initPreview(envKey) {
    if (!window.THREE) return;
    this.stopPreview();

    const width = this.sectorPreview.clientWidth;
    const height = this.sectorPreview.clientHeight;

    this.previewScene = new window.THREE.Scene();
    this.previewCamera = new window.THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.previewCamera.position.set(0, 5, 10);
    this.previewCamera.lookAt(0, 0, 0);

    this.previewRenderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.previewRenderer.setSize(width, height);
    this.sectorPreview.innerHTML = '';
    this.sectorPreview.appendChild(this.previewRenderer.domElement);

    const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
    this.previewScene.add(ambientLight);

    const dirLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    this.previewScene.add(dirLight);

    // Создаем "планету" или фон в зависимости от окружения
    const geometry = new window.THREE.SphereGeometry(5, 32, 32);
    let color = 0x87ceeb; // По умолчанию DAY
    
    // Упрощенное соответствие цветов из EnvironmentConfig
    const envColors = {
        DAY: 0x87ceeb,
        DENSE_CLOUD: 0xa8c4e0,
        NIGHT_CITY: 0x0a0a2a,
        STORM: 0x2a2a3a,
        OCEAN_DAWN: 0xffa07a,
        STRATOSPHERE: 0x1a2a4a,
        SPACE_DEBRIS: 0x050510,
        AURORA: 0x0a1a2a,
        ORBITAL: 0x000018,
        MOON_SHADOW: 0x020208,
        VOID_MIST: 0x1a0a2a,
        ASTEROID_FIELD: 0x1a1a2a,
        FLEET_BATTLE: 0x1a1525,
        MOTHERSHIP: 0x2a1a1a,
        VOID_CORE: 0x120818
    };
    
    if (envColors[envKey]) color = envColors[envKey];
    
    const material = new window.THREE.MeshPhongMaterial({ 
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    
    this.previewMesh = new window.THREE.Mesh(geometry, material);
    this.previewScene.add(this.previewMesh);

    // Добавляем "звезды" или облака для глубины
    const particles = new window.THREE.Group();
    const partGeom = new window.THREE.SphereGeometry(0.1, 8, 8);
    const partMat = new window.THREE.MeshBasicMaterial({ color: 0xffffff });
    for(let i=0; i<50; i++) {
        const p = new window.THREE.Mesh(partGeom, partMat);
        p.position.set(
            (Math.random()-0.5)*20,
            (Math.random()-0.5)*20,
            (Math.random()-0.5)*20
        );
        particles.add(p);
    }
    this.previewScene.add(particles);
    this.particles = particles;

    const animate = () => {
        this.animationId = requestAnimationFrame(animate);
        if (this.previewMesh) {
            this.previewMesh.rotation.y += 0.005;
            this.previewMesh.rotation.x += 0.002;
        }
        if (this.particles) {
            this.particles.rotation.y -= 0.001;
        }
        this.previewRenderer.render(this.previewScene, this.previewCamera);
    };
    animate();
  }

  stopPreview() {
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }
    if (this.previewRenderer) {
        if (this.previewRenderer.domElement && this.previewRenderer.domElement.parentNode) {
            this.previewRenderer.domElement.parentNode.removeChild(this.previewRenderer.domElement);
        }
        this.previewRenderer.dispose();
        this.previewRenderer = null;
    }
    this.previewScene = null;
    this.previewCamera = null;
    this.previewMesh = null;
    this.particles = null;
  }
}

export default BriefingScreen;
