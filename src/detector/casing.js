import * as THREE from 'three';

const CASING_RADIUS = 228;   // just outside the Muon Spectrometer (r = 200)
const CASING_LENGTH = 450;
const BEAM_HOLE_RADIUS = 9;
const RIB_POSITIONS_Z = [-180, -90, 0, 90, 180];

/**
 * Outer detector casing: a bottom semi-cylinder left open on top so the
 * inner layers stay visible, with end caps, edge rails and structural ribs.
 * @returns {THREE.Group}
 */
export function createOuterCasing() {
    const casing = new THREE.Group();
    casing.name = 'outerCasing';

    // Dark steel with a subtle blue tint, translucent so inner layers show.
    const shellMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1e2e,
        metalness: 0.92,
        roughness: 0.38,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
        emissive: 0x05080f,
        emissiveIntensity: 0.5
    });

    // Theta [0 → π] then rotation.x = π/2 maps the arc onto the Y ≤ 0 half.
    const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(
            CASING_RADIUS, CASING_RADIUS, CASING_LENGTH, 80, 1, true, 0, Math.PI
        ),
        shellMaterial
    );
    shell.rotation.x = Math.PI / 2;
    shell.renderOrder = 1;
    casing.add(shell);

    // Semi-circular end caps with a beam-pipe hole. Ring arc π → 2π is the
    // Y < 0 semicircle, matching the shell.
    const capGeometry = new THREE.RingGeometry(BEAM_HOLE_RADIUS, CASING_RADIUS, 80, 1, Math.PI, Math.PI);
    const capMaterial = shellMaterial.clone();
    [CASING_LENGTH / 2, -CASING_LENGTH / 2].forEach((z) => {
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.z = z;
        cap.renderOrder = 1;
        casing.add(cap);
    });

    // Lip rails along the opening edge; emissive so they catch the bloom.
    const lipMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3a3f5c,
        metalness: 0.96,
        roughness: 0.08,
        emissive: 0x10183a,
        emissiveIntensity: 1.4
    });
    const lipGeometry = new THREE.BoxGeometry(6, 6, CASING_LENGTH);
    [-CASING_RADIUS, CASING_RADIUS].forEach((x) => {
        const lip = new THREE.Mesh(lipGeometry, lipMaterial);
        lip.position.set(x, 0, 0);
        casing.add(lip);
    });

    // Half-torus ribs on the outside of the shell, like a real cryostat/yoke.
    // A π-arc torus is the top half; rotation.x = π flips it to the bottom.
    const ribMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x252840,
        metalness: 0.88,
        roughness: 0.25,
        emissive: 0x080a12,
        emissiveIntensity: 0.3
    });
    const ribGeometry = new THREE.TorusGeometry(CASING_RADIUS + 3, 5, 12, 80, Math.PI);
    RIB_POSITIONS_Z.forEach((z) => {
        const rib = new THREE.Mesh(ribGeometry, ribMaterial);
        rib.rotation.x = Math.PI;
        rib.position.z = z;
        casing.add(rib);
    });

    return casing;
}
