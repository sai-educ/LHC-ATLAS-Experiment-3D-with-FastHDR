import * as THREE from 'three';
import { BEAM_SPEED } from '../config.js';

const MAX_TRAIL_POINTS = 20;
const CORE_GEOMETRY = new THREE.SphereGeometry(3, 16, 12);
const GLOW_GEOMETRY = new THREE.SphereGeometry(8, 16, 12);

/** An incoming proton bunch travelling along the beam (Z) axis. */
export class BeamParticle {
    /**
     * @param {number} startZ starting position on the beam axis
     * @param {1 | -1} direction travel direction along Z
     * @param {number} yOffset vertical separation at the start that converges
     *   to zero at the interaction point, so both beams stay distinct even
     *   when the camera looks straight down the beam axis
     */
    constructor(startZ, direction, yOffset = 0) {
        this.startZ = startZ;
        this.yOffset = yOffset;
        this.position = new THREE.Vector3(0, yOffset, startZ);
        this.velocity = new THREE.Vector3(0, 0, direction * BEAM_SPEED);
        this.trail = [];

        this.mesh = new THREE.Mesh(
            CORE_GEOMETRY,
            new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 5,
                metalness: 0,
                roughness: 0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                transparent: true,
                opacity: 1.0,
                depthTest: false   // always visible through any geometry
            })
        );
        this.mesh.renderOrder = 999;
        this.mesh.position.copy(this.position);

        this.glowMesh = new THREE.Mesh(
            GLOW_GEOMETRY,
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide,
                depthTest: false
            })
        );
        this.glowMesh.renderOrder = 999;
        this.mesh.add(this.glowMesh);
    }

    /** @param {number} deltaTime */
    update(deltaTime) {
        this.position.addScaledVector(this.velocity, deltaTime);
        // Full offset at the start, zero at the collision point (z = 0).
        this.position.y = this.yOffset * (Math.abs(this.position.z) / Math.abs(this.startZ));
        this.mesh.position.copy(this.position);

        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 1.0;
        this.glowMesh.scale.setScalar(pulse);

        this.trail.push(this.position.clone());
        if (this.trail.length > MAX_TRAIL_POINTS) this.trail.shift();
    }

    dispose() {
        this.mesh.material.dispose();
        this.glowMesh.material.dispose();
    }
}
