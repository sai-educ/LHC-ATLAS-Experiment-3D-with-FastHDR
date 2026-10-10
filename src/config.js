// Central place for tunable settings and detector geometry.
// Kept free of Three.js imports so the physics modules (and their tests)
// can use it under plain Node.

/**
 * GUI-tunable settings. lil-gui binds to this object and mutates it, so
 * each app instance gets its own fresh copy.
 * @returns {Record<string, number | boolean>}
 */
export function createDefaultParams() {
    return {
        exposure: 5.0,
        bloomStrength: 2.5,
        bloomThreshold: 0.2,
        bloomRadius: 0.8,
        magneticFieldStrength: 2.0,
        traceLength: 100,
        autoRotate: false,
        showTraces: true,
        showGrid: true,
        collisionEnergy: 14,
        particleGlow: 2.0
    };
}

// The simulation advances by a fixed step per rendered frame (~60 fps).
export const FIXED_TIMESTEP = 0.016;

// ── Default camera view ─────────────────────────────────────────────────────
// The camera is placed so the whole detector fits on screen, whatever the
// window shape. Tweak these to change the opening shot (and "Reset View").
export const DEFAULT_VIEW = Object.freeze({
    // Where the camera sits relative to the detector centre (x, y, z).
    // y > 0 looks down into the open-topped casing; larger x/z swings it
    // further round to the side.
    direction: [3, 2, 3],
    // Distance multiplier on the fit around the detector's bounding sphere
    // (which is generous, as the beam pipe sticks out). Smaller = closer.
    padding: 0.8,
    fieldOfView: 60,
    // Fog scales with the framed distance so the scene keeps the same depth
    // falloff on every screen size.
    fogNear: 0.43,
    fogFar: 2.13
});

// ── Detector geometry (scene units) ─────────────────────────────────────────

// Concentric sub-detectors, innermost first. `radius` is the barrel radius;
// `endCap` is the [inner, outer] radius of the matching end-cap ring.
export const DETECTOR_LAYERS = Object.freeze([
    { name: 'Inner Detector',       radius: 50,  color: 0x64ff64, endCap: [5, 50] },
    { name: 'EM Calorimeter',       radius: 100, color: 0x00ffff, endCap: [50, 100] },
    { name: 'Hadronic Calorimeter', radius: 150, color: 0xffa500, endCap: [100, 150] },
    { name: 'Muon Spectrometer',    radius: 200, color: 0xff0000, endCap: [150, 208] }
]);

export const BARREL_LENGTH = 400;
export const END_CAP_Z = 220;            // visual end-cap discs
export const END_CAP_PLANE_Z = 215;      // |z| at which off-axis particles are absorbed
export const BEAM_PIPE_CLEARANCE = 8;    // r_xy below which a particle is still in the pipe
export const DETECTOR_ESCAPE_RADIUS = 320;
export const PARTICLE_MAX_LIFETIME_FRAMES = 300;

// ── Beam / collision timing ─────────────────────────────────────────────────

export const BEAM_START_Z = 250;
export const BEAM_SPEED = 50;
export const BEAM_Y_OFFSET = 6;          // keeps beams distinct when viewed end-on
export const COLLISION_DELAY_MS = 2500;  // beam approach before the collision fires
export const COLLISION_COOLDOWN_MS = 1000;
export const MET_DISPLAY_MS = 4000;
