import * as THREE from 'three';
import { ParticleTypes } from '../physics/particleTypes.js';
import { lorentzVelocityKick } from '../physics/lorentz.js';
import { isAbsorbed, hasLeftDetector } from '../physics/absorption.js';

const CORE_RADIUS = 0.8;
const NEUTRINO_RADIUS = 0.3;
const GLOW_SCALE = 2.5;
const GLOW_INTENSITY_THRESHOLD = 2.0;

// Geometry is shared by every particle; only materials are per-instance.
const sphere = (radius) => new THREE.SphereGeometry(radius, 8, 6);
const GEOMETRY = {
    core: sphere(CORE_RADIUS),
    coreGlow: sphere(CORE_RADIUS * GLOW_SCALE),
    neutrino: sphere(NEUTRINO_RADIUS),
    neutrinoGlow: sphere(NEUTRINO_RADIUS * GLOW_SCALE)
};

/** A collision product travelling out through the detector. */
export class Particle {
    /**
     * @param {string} typeKey key into ParticleTypes
     * @param {THREE.Vector3} velocity
     * @param {number} glowMultiplier current `particleGlow` setting
     */
    constructor(typeKey, velocity, glowMultiplier) {
        this.type = ParticleTypes[typeKey];
        this.position = new THREE.Vector3();
        this.velocity = velocity;
        this.lifetime = 0;
        this.active = true;
        this.trail = [];

        const isInvisible = Boolean(this.type.isInvisible);
        this.mesh = new THREE.Mesh(
            isInvisible ? GEOMETRY.neutrino : GEOMETRY.core,
            new THREE.MeshPhysicalMaterial({
                color: this.type.color,
                emissive: this.type.color,
                emissiveIntensity: this.type.emissiveIntensity * glowMultiplier,
                metalness: 0.1,
                roughness: 0.2,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                transparent: isInvisible,
                opacity: isInvisible ? 0.3 : 1.0
            })
        );

        if (this.type.emissiveIntensity > GLOW_INTENSITY_THRESHOLD) {
            this.glowMesh = new THREE.Mesh(
                isInvisible ? GEOMETRY.neutrinoGlow : GEOMETRY.coreGlow,
                new THREE.MeshBasicMaterial({
                    color: this.type.color,
                    transparent: true,
                    opacity: 0.2,
                    side: THREE.BackSide
                })
            );
            this.mesh.add(this.glowMesh);
        }

        // Neutrinos escape undetected: only their (faint) trace is drawn.
        this.mesh.visible = !isInvisible;
    }

    /**
     * Advances the particle one step.
     * @param {number} deltaTime
     * @param {object} env
     * @param {THREE.Vector3} env.magneticField
     * @param {boolean} env.showTraces
     * @param {number} env.traceLength
     * @param {(position: THREE.Vector3, showerType: string) => void} env.onShower
     */
    update(deltaTime, { magneticField, showTraces, traceLength, onShower }) {
        if (!this.active) return;

        this.velocity.add(
            lorentzVelocityKick(this.velocity, magneticField, this.type.charge, this.type.mass)
        );
        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);

        if (this.glowMesh) {
            const pulse = Math.sin(Date.now() * 0.005 + this.lifetime) * 0.15 + 1.0;
            this.glowMesh.scale.setScalar(pulse);
        }

        if (showTraces) {
            this.trail.push(this.position.clone());
            if (this.trail.length > traceLength) this.trail.shift();
        }

        this.lifetime++;

        if (isAbsorbed(this.position, this.type)) {
            if (this.type.showerType) onShower(this.position.clone(), this.type.showerType);
            this.deactivate();
        } else if (hasLeftDetector(this.position, this.lifetime)) {
            this.deactivate();
        }
    }

    /** @param {number} multiplier */
    setGlow(multiplier) {
        this.mesh.material.emissiveIntensity = this.type.emissiveIntensity * multiplier;
    }

    deactivate() {
        this.active = false;
        this.mesh.visible = false;
    }

    dispose() {
        this.mesh.material.dispose();
        this.glowMesh?.material.dispose();
    }
}
