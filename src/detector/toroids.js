import * as THREE from 'three';

const COIL_COUNT = 8;
const R_INNER = 165;
const R_OUTER = 210;
const Z_END = 182;                         // coil half-length along Z
const BAR = 6;                             // coil bar cross-section
const RADIAL_LENGTH = R_OUTER - R_INNER;
const MID_R = (R_INNER + R_OUTER) / 2;
const CORNER_SIZE = BAR + 3;

/**
 * ATLAS barrel toroid: 8 air-core superconducting coils arranged in an
 * octagon, each in a plane containing the beam axis. They produce the ~1 T
 * azimuthal field that bends muons in the R–Z plane.
 * @returns {THREE.Group}
 */
export function createBarrelToroids() {
    const toroids = new THREE.Group();
    toroids.name = 'barrelToroids';

    const material = new THREE.MeshPhysicalMaterial({
        color: 0x1a3a8a,
        metalness: 0.92,
        roughness: 0.18,
        emissive: 0x061228,
        emissiveIntensity: 0.9
    });
    const radialBar = new THREE.BoxGeometry(RADIAL_LENGTH, BAR, BAR);
    const longitudinalBar = new THREE.BoxGeometry(BAR, BAR, Z_END * 2);
    const corner = new THREE.BoxGeometry(CORNER_SIZE, CORNER_SIZE, CORNER_SIZE);

    const addPart = (geometry, r, z, angle, isRotated = true) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(r * Math.cos(angle), r * Math.sin(angle), z);
        if (isRotated) mesh.rotation.z = angle;   // align the bar radially
        toroids.add(mesh);
    };

    for (let i = 0; i < COIL_COUNT; i++) {
        const angle = (i / COIL_COUNT) * Math.PI * 2;

        // Each coil is a rectangular frame of four bars plus corner joints.
        addPart(radialBar, MID_R, Z_END, angle);
        addPart(radialBar, MID_R, -Z_END, angle);
        addPart(longitudinalBar, R_INNER, 0, angle);
        addPart(longitudinalBar, R_OUTER, 0, angle);

        [[R_INNER, Z_END], [R_OUTER, Z_END], [R_INNER, -Z_END], [R_OUTER, -Z_END]]
            .forEach(([r, z]) => addPart(corner, r, z, angle, false));
    }

    return toroids;
}
