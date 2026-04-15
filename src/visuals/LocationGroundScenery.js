import { EnvironmentConfig } from '../config/MissionConfig.js';
import { getLocationBiome } from '../config/LocationBiomeConfig.js';

const TEX_SIZE = 160;
const GROUND_SEG_W = 56;
const GROUND_SEG_D = 112;
const BASE_DECOR_COUNT = 220;

/**
 * Псевдослучай 0..1 от целых координат.
 */
function hash2(ix, iy, seed) {
    const x = ix * 0.1031 + iy * 0.103 + seed * 0.0973;
    const s = Math.sin(x * 127.1 + iy * 311.7) * 43758.5453123;
    return s - Math.floor(s);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} surface
 * @param {{ r: number, g: number, b: number }} tint
 * @param {number} seed
 * @param {boolean} displacementOnly
 */
function fillGroundCanvas(ctx, surface, tint, seed, displacementOnly) {
    const w = TEX_SIZE;
    const h = TEX_SIZE;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const n =
                hash2(px, py, seed) * 0.5 +
                hash2(px >> 1, py >> 1, seed + 1) * 0.3 +
                hash2(px >> 2, py >> 2, seed + 2) * 0.2;
            let v = n;
            if (surface === 'grass' || surface === 'forest') {
                const stripe = (Math.sin(px * 0.18 + py * 0.04 + seed) + 1) * 0.5;
                v = v * 0.72 + stripe * 0.28;
            } else if (surface === 'urban' || surface === 'industrial') {
                const grid = ((px ^ py) & 3) === 0 ? 0.15 : 0;
                v = v * 0.55 + grid;
            } else if (surface === 'water') {
                v = 0.35 + n * 0.45 + Math.sin(px * 0.25 + py * 0.12) * 0.12;
            } else if (surface === 'alpine') {
                v = n * 0.65 + (py / h) * 0.35;
            } else if (surface === 'space') {
                v = n * 0.4 + 0.2;
            } else if (surface === 'alien') {
                const swirl = Math.sin(px * 0.08 + py * 0.11 + seed * 0.7) * 0.5 + 0.5;
                v = n * 0.5 + swirl * 0.35;
            }
            const idx = (py * w + px) * 4;
            const lit = 0.55 + v * 0.45;
            if (displacementOnly) {
                const g = Math.floor(v * 255);
                d[idx] = g;
                d[idx + 1] = g;
                d[idx + 2] = g;
                d[idx + 3] = 255;
            } else {
                d[idx] = Math.min(255, Math.floor(tint.r * lit));
                d[idx + 1] = Math.min(255, Math.floor(tint.g * lit));
                d[idx + 2] = Math.min(255, Math.floor(tint.b * lit));
                d[idx + 3] = 255;
            }
        }
    }
    ctx.putImageData(img, 0, 0);
}

function hexToRgb(hex) {
    const h = hex & 0xffffff;
    return {
        r: ((h >> 16) & 0xff) / 255,
        g: ((h >> 8) & 0xff) / 255,
        b: (h & 0xff) / 255
    };
}

/**
 * Две плоскости земли (нижняя + смесь сверху) и два слоя декора для crossfade.
 */
export class LocationGroundScenery {
    /**
     * @param {typeof import('three')} THREE
     * @param {import('three').Scene} scene
     * @param {object} opts
     * @param {number} opts.width
     * @param {number} opts.depth
     * @param {number} opts.y
     */
    constructor(THREE, scene, opts) {
        this.THREE = THREE;
        this.scene = scene;
        this.width = opts.width;
        this.depth = opts.depth;
        this.y = opts.y;

        this._textureCache = new Map();
        this._keyA = '';
        this._keyB = '';

        this.group = new THREE.Group();
        this.group.name = 'skyace-ground-scenery';
        scene.add(this.group);

        const geom = new THREE.PlaneGeometry(this.width, this.depth, GROUND_SEG_W, GROUND_SEG_D);

        this.matA = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: true,
            shininess: 12
        });
        this.matB = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: true,
            shininess: 12,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });

        this.meshA = new THREE.Mesh(geom, this.matA);
        this.meshA.receiveShadow = true;
        this.meshA.rotation.x = -Math.PI / 2;
        this.meshA.position.y = 0;
        this.meshB = new THREE.Mesh(geom.clone(), this.matB);
        this.meshB.receiveShadow = true;
        this.meshB.rotation.x = -Math.PI / 2;
        this.meshB.position.y = 0.04;

        this.group.add(this.meshA);
        this.group.add(this.meshB);

        this.decorRootA = new THREE.Group();
        this.decorRootB = new THREE.Group();
        this.group.add(this.decorRootA);
        this.group.add(this.decorRootB);

        /** @type {import('three').InstancedMesh|null} */
        this._instA = null;
        /** @type {import('three').InstancedMesh|null} */
        this._instB = null;

        this._dummy = new THREE.Object3D();
    }

    /**
     * @param {string} envKey
     * @returns {{ map: import('three').CanvasTexture, displacementMap: import('three').CanvasTexture, biome: ReturnType<typeof getLocationBiome> }}
     */
    _getTexturesForKey(envKey) {
        if (this._textureCache.has(envKey)) {
            return this._textureCache.get(envKey);
        }
        const THREE = this.THREE;
        const env = EnvironmentConfig[envKey];
        const biome = getLocationBiome(envKey);
        const tint = hexToRgb(env && env.groundColor != null ? env.groundColor : 0x3b7d3b);
        const seed = envKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 997;

        const canvasColor = document.createElement('canvas');
        canvasColor.width = TEX_SIZE;
        canvasColor.height = TEX_SIZE;
        const ctxC = canvasColor.getContext('2d');
        fillGroundCanvas(ctxC, biome.surface, tint, seed, false);

        const canvasDisp = document.createElement('canvas');
        canvasDisp.width = TEX_SIZE;
        canvasDisp.height = TEX_SIZE;
        const ctxD = canvasDisp.getContext('2d');
        fillGroundCanvas(ctxD, biome.surface, { r: 1, g: 1, b: 1 }, seed + 11, true);

        const map = new THREE.CanvasTexture(canvasColor);
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(5 * biome.textureScale, 14 * biome.textureScale);

        const displacementMap = new THREE.CanvasTexture(canvasDisp);
        displacementMap.wrapS = THREE.RepeatWrapping;
        displacementMap.wrapT = THREE.RepeatWrapping;
        displacementMap.repeat.copy(map.repeat);

        const pack = { map, displacementMap, biome };
        this._textureCache.set(envKey, pack);
        return pack;
    }

    /**
     * @param {import('three').MeshPhongMaterial} mat
     * @param {string} envKey
     */
    _applyMaterialFromKey(mat, envKey) {
        const env = EnvironmentConfig[envKey];
        const { map, displacementMap, biome } = this._getTexturesForKey(envKey);
        mat.map = map;
        mat.displacementMap = displacementMap;
        mat.displacementScale = biome.displacementScale;
        mat.displacementBias = -biome.displacementScale * 0.35;
        if (env && mat.color) mat.color.setHex(env.groundColor);
    }

    /**
     * @param {'trees'|'urban'|'sparse'|'ocean'|'alpine'|'debris'|'void'|'fleet'|'mothership'} decor
     * @param {import('three').InstancedMesh|null} oldMesh
     * @param {import('three').Group} root
     * @param {number} amountMul
     * @returns {import('three').InstancedMesh|null}
     */
    _buildDecorMesh(decor, oldMesh, root, amountMul) {
        const THREE = this.THREE;
        if (oldMesh) {
            root.remove(oldMesh);
            oldMesh.geometry.dispose();
            oldMesh.material.dispose();
        }
        let geom;
        let matColor = 0x2d5a2d;
        if (decor === 'trees') {
            geom = new THREE.ConeGeometry(1.6, 5.5, 6);
            matColor = 0x1e6b32;
        } else if (decor === 'urban') {
            geom = new THREE.BoxGeometry(3, 10, 3);
            matColor = 0x3a4555;
        } else if (decor === 'sparse') {
            geom = new THREE.ConeGeometry(1.2, 3.5, 5);
            matColor = 0x2a5a40;
        } else if (decor === 'ocean') {
            geom = new THREE.CylinderGeometry(0.4, 1.2, 1.8, 5);
            matColor = 0x2a4a58;
        } else if (decor === 'alpine') {
            geom = new THREE.ConeGeometry(1.4, 4.2, 5);
            matColor = 0x6a7a88;
        } else if (decor === 'debris') {
            geom = new THREE.TetrahedronGeometry(2.2, 0);
            matColor = 0x5a5a68;
        } else if (decor === 'void') {
            geom = new THREE.BoxGeometry(2.5, 4, 1.2);
            matColor = 0x6a3a8a;
        } else if (decor === 'fleet') {
            geom = new THREE.BoxGeometry(5, 2.2, 2.2);
            matColor = 0x4a3a5a;
        } else if (decor === 'mothership') {
            geom = new THREE.BoxGeometry(8, 1.8, 4);
            matColor = 0x5a3a3a;
        } else {
            geom = new THREE.ConeGeometry(1.2, 3, 5);
            matColor = 0x2d5a2d;
        }

        const count = Math.max(8, Math.floor(BASE_DECOR_COUNT * amountMul));
        const mat = new THREE.MeshPhongMaterial({
            color: matColor,
            flatShading: true,
            transparent: true,
            opacity: 1,
            depthWrite: true
        });
        const mesh = new THREE.InstancedMesh(geom, mat, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        root.add(mesh);
        mesh.count = count;
        return mesh;
    }

    /**
     * @param {import('three').InstancedMesh|null} mesh
     * @param {ReturnType<typeof getLocationBiome>} biome
     * @param {number} playerZ
     */
    _fillDecorMatrices(mesh, biome, playerZ) {
        if (!mesh) return;
        const THREE = this.THREE;
        const d = this._dummy;
        const count = mesh.count;
        const decor = biome.decor;
        const spreadX = this.width * 0.42;
        const anchor = Math.floor(-playerZ / 420) * 420;
        for (let i = 0; i < count; i++) {
            const t = i / Math.max(1, count - 1);
            const h = hash2(i, (i * 17) % 997, anchor | 0);
            const z = playerZ - 90 - t * 2800 - h * 40 + (anchor % 200) * 0.01;
            const x = (h - 0.5) * 2 * spreadX * (0.35 + hash2(i + 3, i * 2, 1) * 0.65);
            const scale =
                decor === 'urban' || decor === 'fleet' || decor === 'mothership'
                    ? 0.85 + hash2(i, 5, 2) * 0.9
                    : 0.55 + hash2(i, 9, 3) * 1.15;
            d.position.set(x, this.y + scale * 0.2, z);
            d.scale.setScalar(scale);
            d.rotation.set(
                (hash2(i, 1, 4) - 0.5) * 0.12,
                hash2(i, 2, 5) * Math.PI * 2,
                (hash2(i, 3, 6) - 0.5) * 0.12
            );
            d.updateMatrix();
            mesh.setMatrixAt(i, d.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    _ensureDecorLayer(instRef, key, root, playerZ) {
        const biome = getLocationBiome(key);
        const needRebuild = !instRef || instRef.userData.decor !== biome.decor;
        let mesh = instRef;
        if (needRebuild) {
            mesh = this._buildDecorMesh(biome.decor, mesh, root, biome.decorAmount);
            if (mesh) mesh.userData.decor = biome.decor;
        }
        this._fillDecorMatrices(mesh, biome, playerZ);
        return mesh;
    }

    /**
     * Мгновенное применение локации (кампания / меню).
     * @param {string} envKey
     */
    applyInstant(envKey) {
        this._keyA = envKey;
        this._keyB = envKey;
        this._applyMaterialFromKey(this.matA, envKey);
        this.matB.opacity = 0;
        this.meshB.visible = false;
        const env = EnvironmentConfig[envKey];
        if (env && this.matA.color) this.matA.color.setHex(env.groundColor);

        this._instA = this._ensureDecorLayer(this._instA, envKey, this.decorRootA, 0);
        if (this._instB) {
            this.decorRootB.remove(this._instB);
            this._instB.geometry.dispose();
            this._instB.material.dispose();
            this._instB = null;
        }
        if (this._instA && this._instA.material) {
            this._instA.material.opacity = 1;
        }
    }

    /**
     * Плавное смешение двух локаций (бесконечный режим).
     * @param {string} keyA
     * @param {string} keyB
     * @param {number} t 0..1
     * @param {number} playerZ
     */
    setBlend(keyA, keyB, t, playerZ) {
        const tt = Math.max(0, Math.min(1, t));
        if (this._keyA !== keyA) {
            this._applyMaterialFromKey(this.matA, keyA);
            this._keyA = keyA;
        }
        if (this._keyB !== keyB) {
            this._applyMaterialFromKey(this.matB, keyB);
            this._keyB = keyB;
        }

        if (keyA === keyB || tt < 0.001) {
            this.meshB.visible = false;
            this.matB.opacity = 0;
            if (this._instB) {
                this.decorRootB.remove(this._instB);
                this._instB.geometry.dispose();
                this._instB.material.dispose();
                this._instB = null;
            }
            this._instA = this._ensureDecorLayer(this._instA, keyA, this.decorRootA, playerZ);
            if (this._instA && this._instA.material) {
                this._instA.material.opacity = 1;
                this._instA.material.transparent = false;
                this._instA.material.depthWrite = true;
            }
            return;
        }

        this.meshB.visible = tt > 0.002;
        this.matB.opacity = tt;
        this.matB.depthWrite = tt >= 0.995;

        this._instA = this._ensureDecorLayer(this._instA, keyA, this.decorRootA, playerZ);
        this._instB = this._ensureDecorLayer(this._instB, keyB, this.decorRootB, playerZ);

        if (this._instA && this._instA.material) {
            this._instA.material.opacity = 1 - tt;
            this._instA.material.transparent = tt > 0.02;
            this._instA.material.depthWrite = tt < 0.98;
        }
        if (this._instB && this._instB.material) {
            this._instB.material.opacity = tt;
            this._instB.material.transparent = tt < 0.98;
            this._instB.material.depthWrite = tt > 0.02;
        }
    }

    /**
     * Каждый кадр обновить позиции декора относительно игрока.
     * @param {number} playerZ
     * @param {string} keyA
     * @param {string} keyB
     * @param {number} t
     */
    tickScroll(playerZ, keyA, keyB, t) {
        const tt = Math.max(0, Math.min(1, t));
        if (this._instA) this._fillDecorMatrices(this._instA, getLocationBiome(keyA), playerZ);
        if (keyA !== keyB && this._instB && tt > 0.001) {
            this._fillDecorMatrices(this._instB, getLocationBiome(keyB), playerZ);
        }
    }

    setWorldPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }
}
