import * as THREE from 'three';
import { DETECTOR_LAYERS, END_CAP_Z } from '../config.js';

const SECTORS = 24;
const SECTOR_DEPTH = 8;
const SECTOR_FILL = 0.78;

function createEndCapLayer({ color, endCap: [rIn, rOut] }, z) {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(rIn, rOut, 48, 1),
        new THREE.MeshPhysicalMaterial({
            color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.8,
            emissive: color,
            emissiveIntensity: 0.04
        })
    );
    ring.position.z = z;
    group.add(ring);

    // Segmented modules mimic the sector granularity of each sub-detector.
    const midR = (rIn + rOut) / 2;
    const sectorGeometry = new THREE.BoxGeometry((rOut - rIn) * SECTOR_FILL, 4, SECTOR_DEPTH);
    const sectorMaterial = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.28,
        metalness: 0.8,
        roughness: 0.2
    });
    for (let i = 0; i < SECTORS; i++) {
        const phi = (i / SECTORS) * Math.PI * 2;
        const sector = new THREE.Mesh(sectorGeometry, sectorMaterial);
        sector.position.set(
            midR * Math.cos(phi),
            midR * Math.sin(phi),
            z + Math.sign(z) * SECTOR_DEPTH * 0.5
        );
        sector.rotation.z = phi;   // align radially
        group.add(sector);
    }

    return group;
}

/**
 * End-cap discs at both ends of the barrel. They extend coverage toward the
 * forward region (high pseudorapidity η) with concentric layer rings.
 * @returns {THREE.Group}
 */
export function createEndCaps() {
    const endCaps = new THREE.Group();
    endCaps.name = 'endCaps';
    [END_CAP_Z, -END_CAP_Z].forEach((z) => {
        DETECTOR_LAYERS.forEach((layer) => endCaps.add(createEndCapLayer(layer, z)));
    });
    return endCaps;
}
