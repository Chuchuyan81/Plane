/**
 * Вспышка и разлетающиеся осколки при уничтожении врага/босса.
 * @param {import('three').Scene} scene
 * @param {import('three').Vector3} position
 * @param {'enemy'|'boss'} variant
 */
export function spawnDeathExplosion(scene, position, variant = 'enemy') {
    const THREE = window.THREE;
    if (!scene || !position) return;

    const isBoss = variant === 'boss';
    const shardCount = isBoss ? 26 : 12;
    const shardScale = isBoss ? [1.2, 3.2] : [0.35, 0.95];
    const lifeMs = isBoss ? 900 + Math.random() * 350 : 520 + Math.random() * 220;
    const speedMul = isBoss ? 1.35 : 1;

    const flash = new THREE.PointLight(0xffee88, isBoss ? 14 : 8, isBoss ? 120 : 70, 2);
    flash.position.copy(position);
    scene.add(flash);
    const tFlash = performance.now();
    const flashDur = isBoss ? 380 : 240;

    const animFlash = (time) => {
        const e = time - tFlash;
        if (e > flashDur) {
            scene.remove(flash);
            return;
        }
        flash.intensity = (isBoss ? 14 : 8) * (1 - e / flashDur);
        requestAnimationFrame(animFlash);
    };
    requestAnimationFrame(animFlash);

    const colors = [0xff6600, 0xff3300, 0xffaa00, 0xffcc66, 0x888888];
    for (let i = 0; i < shardCount; i++) {
        const s = shardScale[0] + Math.random() * (shardScale[1] - shardScale[0]);
        const geom = new THREE.TetrahedronGeometry(s * (0.4 + Math.random() * 0.6), 0);
        const mat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 1
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(position);
        mesh.position.add(
            new THREE.Vector3(
                (Math.random() - 0.5) * (isBoss ? 10 : 4),
                (Math.random() - 0.5) * (isBoss ? 6 : 3),
                (Math.random() - 0.5) * (isBoss ? 10 : 4)
            )
        );
        mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        scene.add(mesh);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * (28 + Math.random() * 16) * speedMul,
            (Math.random() - 0.5) * (22 + Math.random() * 12) * speedMul,
            (Math.random() - 0.5) * (28 + Math.random() * 16) * speedMul
        );
        const spin = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        const t0 = performance.now();
        const life = lifeMs * (0.75 + Math.random() * 0.5);

        const anim = (time) => {
            const elapsed = time - t0;
            if (elapsed > life) {
                scene.remove(mesh);
                geom.dispose();
                mat.dispose();
                return;
            }
            const k = 0.016;
            mesh.position.addScaledVector(velocity, k);
            velocity.multiplyScalar(0.985);
            mesh.rotation.x += spin.x * k;
            mesh.rotation.y += spin.y * k;
            mesh.rotation.z += spin.z * k;
            mat.opacity = Math.max(0, 1 - elapsed / life);
            requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    }
}
