import * as THREE from 'three';
import { DETECTOR_LAYERS, BARREL_LENGTH } from '../config.js';

const SEGMENTS = 24;
const MODULES_PER_RING = 24;
const MODULE_Z_EXTENT = 180;
const MODULE_Z_SPACING = 60;
const MODULE_GEOMETRY = new THREE.BoxGeometry(5, 5, 20);

function createBarrelLayer({ radius, color }) {
    const group = new THREE.Group();

    const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, BARREL_LENGTH, SEGMENTS, 1, true),
        new THREE.MeshPhysicalMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.8,
            clearcoat: 0.3,
            clearcoatRoughness: 0.5
        })
    );
    shell.rotation.x = Math.PI / 2;
    group.add(shell);

    // Detector modules tiled around the cylinder.
    const moduleMaterial = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        metalness: 0.8,
        roughness: 0.2
    });
    for (let i = 0; i < MODULES_PER_RING; i++) {
        const angle = (i / MODULES_PER_RING) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        for (let z = -MODULE_Z_EXTENT; z <= MODULE_Z_EXTENT; z += MODULE_Z_SPACING) {
            const module = new THREE.Mesh(MODULE_GEOMETRY, moduleMaterial);
            module.position.set(x, y, z);
            module.lookAt(0, 0, z);
            group.add(module);
        }
    }

    return group;
}

/**
 * Cylindrical barrel sub-detectors: Inner Detector, EM and Hadronic
 * calorimeters, and the Muon Spectrometer.
 * @returns {THREE.Group}
 */
export function createBarrel() {
    const barrel = new THREE.Group();
    barrel.name = 'barrel';
    DETECTOR_LAYERS.forEach((layer) => barrel.add(createBarrelLayer(layer)));
    return barrel;
}
