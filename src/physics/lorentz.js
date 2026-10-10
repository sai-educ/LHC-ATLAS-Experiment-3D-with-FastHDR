// Scales the v × B kick into scene units per frame.
const LORENTZ_COUPLING = 0.01;

/**
 * Velocity change from the Lorentz force F = q (v × B) for one step.
 * Massless particles are treated as unit mass so photons stay well-defined.
 * @param {{x: number, y: number, z: number}} velocity
 * @param {{x: number, y: number, z: number}} field magnetic field B
 * @param {number} charge in units of e
 * @param {number} mass in MeV
 * @returns {{x: number, y: number, z: number}} a new vector; inputs are untouched
 */
export function lorentzVelocityKick(velocity, field, charge, mass) {
    if (charge === 0) return { x: 0, y: 0, z: 0 };

    const k = (charge * LORENTZ_COUPLING) / (mass || 1);
    return {
        x: (velocity.y * field.z - velocity.z * field.y) * k,
        y: (velocity.z * field.x - velocity.x * field.z) * k,
        z: (velocity.x * field.y - velocity.y * field.x) * k
    };
}
