// Camera framing maths, kept free of Three.js so it can be unit-tested.

const DEG_TO_RAD = Math.PI / 180;

/**
 * Camera distance at which a bounding sphere fits entirely in view.
 * Uses whichever of the vertical / horizontal field of view is narrower,
 * so the fit holds on both landscape and portrait screens.
 * @param {number} radius bounding-sphere radius
 * @param {number} verticalFovDeg camera vertical field of view, in degrees
 * @param {number} aspect viewport width / height
 * @param {number} padding multiplier > 1 leaves space around the object
 * @returns {number}
 */
export function fitDistance(radius, verticalFovDeg, aspect, padding = 1) {
    if (!(radius > 0) || !(verticalFovDeg > 0) || !(aspect > 0)) {
        throw new RangeError('fitDistance needs a positive radius, field of view and aspect');
    }
    const halfVertical = (verticalFovDeg * DEG_TO_RAD) / 2;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
    const limitingHalfAngle = Math.min(halfVertical, halfHorizontal);
    return (radius / Math.sin(limitingHalfAngle)) * padding;
}
