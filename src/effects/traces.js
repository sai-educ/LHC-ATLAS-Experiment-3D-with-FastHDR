import * as THREE from 'three';

const TRACE_OPACITY = 0.7;
const INVISIBLE_TRACE_OPACITY = 0.2;
const BEAM_TRACE_COLOR = 0xffffff;

/**
 * Line traces behind particles and beams, rebuilt every frame from trails.
 * @param {THREE.Scene} scene
 * @returns {{ update: (particles: object[], beams: object[]) => void, setVisible: (isVisible: boolean) => void }}
 */
export function createTraceLayer(scene) {
    const group = new THREE.Group();
    group.name = 'traces';
    scene.add(group);

    // Materials are reused across frames; only line geometry is rebuilt.
    const materials = new Map();
    const materialFor = (color, opacity) => {
        const key = `${color}:${opacity}`;
        if (!materials.has(key)) {
            materials.set(key, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
        }
        return materials.get(key);
    };

    const clearLines = () => {
        group.children.forEach((line) => line.geometry.dispose());
        group.clear();
    };

    const addLine = (points, material) => {
        if (points.length < 2) return;
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    };

    const update = (particles, beams) => {
        clearLines();
        particles
            .filter((p) => p.active)
            .forEach((p) => {
                const opacity = p.type.isInvisible ? INVISIBLE_TRACE_OPACITY : TRACE_OPACITY;
                addLine(p.trail, materialFor(p.type.color, opacity));
            });
        beams.forEach((beam) => addLine(beam.trail, materialFor(BEAM_TRACE_COLOR, 1.0)));
    };

    const setVisible = (isVisible) => { group.visible = isVisible; };

    return { update, setVisible };
}
