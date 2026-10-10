import * as THREE from 'three';
import { createBarrel } from './barrel.js';
import { createEndCaps } from './endCaps.js';
import { createBarrelToroids } from './toroids.js';
import { createOuterCasing } from './casing.js';

function createBeamPipe() {
    const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 5, 500, 16),
        new THREE.MeshPhysicalMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.3,
            transparent: true,
            opacity: 0.3
        })
    );
    pipe.name = 'beamPipe';
    pipe.rotation.x = Math.PI / 2;
    return pipe;
}

/**
 * Assembles the full static ATLAS detector model.
 * @returns {THREE.Group}
 */
export function createDetector() {
    const detector = new THREE.Group();
    detector.name = 'detector';
    detector.add(
        createBarrel(),
        createBeamPipe(),
        createOuterCasing(),
        createBarrelToroids(),
        createEndCaps()
    );
    return detector;
}
