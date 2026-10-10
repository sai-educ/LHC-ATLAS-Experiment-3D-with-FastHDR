import {
    END_CAP_PLANE_Z,
    BEAM_PIPE_CLEARANCE,
    DETECTOR_ESCAPE_RADIUS,
    PARTICLE_MAX_LIFETIME_FRAMES
} from '../config.js';

/**
 * Whether a particle at `position` has been stopped by the detector.
 * Real ATLAS calorimeters are cylindrical, so the barrel test uses the
 * transverse radius r_xy, and the end-caps use |z|.
 * @param {{x: number, y: number, z: number}} position
 * @param {{stopRadius: number}} type entry from ParticleTypes
 * @returns {boolean}
 */
export function isAbsorbed(position, type) {
    const rTrans = Math.hypot(position.x, position.y);
    const hitBarrel = rTrans > type.stopRadius;
    const hitEndCap = Math.abs(position.z) > END_CAP_PLANE_Z && rTrans > BEAM_PIPE_CLEARANCE;
    return hitBarrel || hitEndCap;
}

/**
 * Whether a particle has flown out of the simulated volume or expired.
 * @param {{x: number, y: number, z: number}} position
 * @param {number} lifetimeFrames
 * @returns {boolean}
 */
export function hasLeftDetector(position, lifetimeFrames) {
    const distance = Math.hypot(position.x, position.y, position.z);
    return distance > DETECTOR_ESCAPE_RADIUS || lifetimeFrames > PARTICLE_MAX_LIFETIME_FRAMES;
}
