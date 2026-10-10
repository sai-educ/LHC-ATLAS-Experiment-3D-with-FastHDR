import * as THREE from 'three';
import { MET_DISPLAY_MS } from '../config.js';

const MIN_VISIBLE_MET = 3;
const LENGTH_SCALE = 4;
const MAX_LENGTH = 175;
const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * Yellow arrow showing Missing Transverse Energy: the direction of momentum
 * carried off by undetected neutrinos (a key dark-matter search signature).
 * @param {THREE.Scene} scene
 * @returns {{ show: (met: {x: number, y: number}) => void, clear: () => void }}
 */
export function createMetIndicator(scene) {
    let arrow = null;
    let hideTimer = null;

    const clear = () => {
        clearTimeout(hideTimer);
        if (!arrow) return;
        scene.remove(arrow);
        arrow.dispose();
        arrow = null;
    };

    const show = ({ x, y }) => {
        clear();
        const magnitude = Math.hypot(x, y);
        if (magnitude < MIN_VISIBLE_MET) return;

        const direction = new THREE.Vector3(x, y, 0).normalize();
        const length = Math.min(magnitude * LENGTH_SCALE, MAX_LENGTH);
        arrow = new THREE.ArrowHelper(direction, ORIGIN, length, 0xffff00, 18, 10);
        scene.add(arrow);
        hideTimer = setTimeout(clear, MET_DISPLAY_MS);
    };

    return { show, clear };
}
