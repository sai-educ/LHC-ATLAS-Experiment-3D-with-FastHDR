import * as THREE from 'three';
import { Particle } from './entities/Particle.js';
import { BeamParticle } from './entities/BeamParticle.js';
import { generateCollisionProducts, missingTransverseMomentum } from './physics/collisionEvent.js';
import { createShower } from './effects/shower.js';
import { createCollisionFlash } from './effects/collisionFlash.js';
import { createMetIndicator } from './effects/metArrow.js';
import {
    BEAM_START_Z,
    BEAM_Y_OFFSET,
    COLLISION_DELAY_MS,
    COLLISION_COOLDOWN_MS
} from './config.js';

const toVector3 = ({ x, y, z }) => new THREE.Vector3(x, y, z);

/**
 * Owns the dynamic part of the scene: incoming beams, the collision itself
 * and the outgoing particles.
 * @param {object} deps
 * @param {THREE.Scene} deps.scene
 * @param {object} deps.params settings from createDefaultParams()
 * @param {THREE.Vector3} deps.magneticField solenoid field, read every step
 * @param {object} deps.hud from createHud()
 */
export function createCollisionSimulation({ scene, params, magneticField, hud }) {
    const particleGroup = new THREE.Group();
    const beamGroup = new THREE.Group();
    particleGroup.name = 'particles';
    beamGroup.name = 'beams';
    scene.add(particleGroup, beamGroup);

    const met = createMetIndicator(scene);
    const onShower = (position, showerType) => createShower(scene, position, showerType);

    let particles = [];
    let beams = [];
    let beamStartTime = 0;
    let isBusy = false;

    const removeAll = (group, items) => {
        items.forEach((item) => {
            group.remove(item.mesh);
            item.dispose();
        });
    };

    const spawnProducts = () => {
        const products = generateCollisionProducts();
        particles = products.map(({ typeKey, velocity }) =>
            new Particle(typeKey, toVector3(velocity), params.particleGlow)
        );
        particles.forEach((p) => particleGroup.add(p.mesh));
        met.show(missingTransverseMomentum(products));
        hud.setParticleCount(particles.length);
    };

    const collide = () => {
        removeAll(beamGroup, beams);
        beams = [];
        createCollisionFlash(scene);
        spawnProducts();
        setTimeout(() => {
            isBusy = false;
            hud.setCollisionActive(false);
        }, COLLISION_COOLDOWN_MS);
    };

    const sweepInactive = () => {
        const spent = particles.filter((p) => !p.active);
        if (spent.length === 0) return;
        removeAll(particleGroup, spent);
        particles = particles.filter((p) => p.active);
        hud.setParticleCount(particles.length);
    };

    /** Fires two proton beams at each other; ignored while one is running. */
    const trigger = () => {
        if (isBusy) return;
        isBusy = true;
        hud.setCollisionActive(true);

        removeAll(particleGroup, particles);
        particles = [];
        met.clear();

        beams = [
            new BeamParticle(-BEAM_START_Z, 1, BEAM_Y_OFFSET),
            new BeamParticle(BEAM_START_Z, -1, -BEAM_Y_OFFSET)
        ];
        beams.forEach((beam) => beamGroup.add(beam.mesh));
        beamStartTime = performance.now();
    };

    /** @param {number} deltaTime */
    const update = (deltaTime) => {
        if (beams.length > 0) {
            if (performance.now() - beamStartTime >= COLLISION_DELAY_MS) collide();
            else beams.forEach((beam) => beam.update(deltaTime));
        }

        const env = {
            magneticField,
            showTraces: params.showTraces,
            traceLength: params.traceLength,
            onShower
        };
        particles.forEach((p) => p.update(deltaTime, env));
        sweepInactive();
    };

    /** @param {number} multiplier */
    const setGlow = (multiplier) => particles.forEach((p) => p.setGlow(multiplier));

    return {
        trigger,
        update,
        setGlow,
        get particles() { return particles; },
        get beams() { return beams; }
    };
}
