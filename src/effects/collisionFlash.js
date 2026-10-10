import * as THREE from 'three';

const FLASH_INTENSITY = 30;
const FLASH_RANGE = 500;
const MIN_INTENSITY = 0.01;

/**
 * Bright flash, expanding sphere and cyan shockwave at the interaction point.
 * @param {THREE.Scene} scene
 */
export function createCollisionFlash(scene) {
    const flash = new THREE.PointLight(0xffffff, FLASH_INTENSITY, FLASH_RANGE);

    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        side: THREE.BackSide
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), sphereMaterial);

    const shockwaveMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const shockwave = new THREE.Mesh(new THREE.RingGeometry(1, 2, 64), shockwaveMaterial);
    shockwave.rotation.x = Math.PI / 2;

    const parts = [flash, sphere, shockwave];
    scene.add(...parts);

    const tick = () => {
        flash.intensity *= 0.92;
        sphere.scale.multiplyScalar(1.15);
        sphereMaterial.opacity *= 0.95;
        shockwave.scale.multiplyScalar(1.2);
        shockwaveMaterial.opacity *= 0.93;

        if (flash.intensity > MIN_INTENSITY) {
            requestAnimationFrame(tick);
            return;
        }
        scene.remove(...parts);
        flash.dispose();
        [sphere, shockwave].forEach((mesh) => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
    };
    tick();
}
