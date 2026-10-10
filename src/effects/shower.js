import * as THREE from 'three';

// EM showers (e±, γ) are compact and yellow-green; hadronic showers (π, K)
// are wider and orange-red.
const SHOWER_STYLES = {
    EM:  { count: 10, maxSpread: 12, spread: 0.5, speed: 0.065, color: 0xffee44, lightColor: 0xffff88, lightIntensity: 10 },
    HAD: { count: 16, maxSpread: 22, spread: 1.1, speed: 0.042, color: 0xff5500, lightColor: 0xff8844, lightIntensity: 6 }
};
const LIGHT_RANGE = 90;
const LIGHT_DECAY_STEP = 0.07;
const FRAGMENT_GEOMETRY = new THREE.SphereGeometry(0.55, 4, 4);

// Runs `step(t)` every frame while t < 1, then calls `done`.
function animateUntilDone(increment, step, done) {
    let t = 0;
    const tick = () => {
        t += increment;
        step(t);
        if (t < 1) requestAnimationFrame(tick);
        else done();
    };
    tick();
}

function flashLight(scene, position, { lightColor, lightIntensity }) {
    const light = new THREE.PointLight(lightColor, lightIntensity, LIGHT_RANGE);
    light.position.copy(position);
    scene.add(light);
    animateUntilDone(
        LIGHT_DECAY_STEP,
        (t) => { light.intensity = Math.max(0, lightIntensity * (1 - t)); },
        () => { scene.remove(light); light.dispose(); }
    );
}

function sprayFragment(scene, position, { maxSpread, spread, speed, color }) {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });
    const fragment = new THREE.Mesh(FRAGMENT_GEOMETRY, material);
    fragment.position.copy(position);
    scene.add(fragment);

    // Radially outward from the beam axis, within a cone.
    const jitter = () => (Math.random() - 0.5) * spread;
    const direction = position.clone().normalize()
        .add(new THREE.Vector3(jitter(), jitter(), jitter()))
        .normalize()
        .multiplyScalar(maxSpread * (0.4 + Math.random() * 0.6));

    animateUntilDone(
        speed,
        (t) => {
            fragment.position.addScaledVector(direction, speed * 1.6);
            material.opacity = Math.max(0, 1 - t);
            fragment.scale.setScalar(1 + t * 2.5);
        },
        () => { scene.remove(fragment); material.dispose(); }
    );
}

/**
 * Brief burst of glowing fragments where a particle is absorbed by a
 * calorimeter layer.
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3} position
 * @param {'EM' | 'HAD'} showerType
 */
export function createShower(scene, position, showerType) {
    const style = SHOWER_STYLES[showerType];
    if (!style) throw new Error(`Unknown shower type: ${showerType}`);

    flashLight(scene, position, style);
    for (let i = 0; i < style.count; i++) sprayFragment(scene, position, style);
}
