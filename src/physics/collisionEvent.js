// Monte-Carlo-style generation of the products of one proton–proton collision.
// Pure functions over plain {x, y, z} objects; the caller turns the result
// into scene objects. Pass a custom `rng` for reproducible events.

import { ParticleTypes } from './particleTypes.js';

const MIN_PRODUCTS = 30;
const EXTRA_PRODUCTS = 20;
const MIN_MOMENTUM = 10;
const MOMENTUM_RANGE = 40;
const BOOST_CHANCE = 0.3;
const BOOST_FACTOR = 1.5;

const JET_CHANCE = 0.7;
const PARTICLES_PER_JET = 5;
const JET_MIN_SPEED = 30;
const JET_SPEED_RANGE = 20;
const JET_SPREAD = 5;

// Cumulative product mix, roughly based on real LHC data.
const PRODUCT_MIX = [
    { upTo: 0.40, types: ['PION', 'KAON'] },          // hadrons
    { upTo: 0.60, types: ['PHOTON'] },
    { upTo: 0.75, types: ['ELECTRON', 'POSITRON'] },
    { upTo: 0.90, types: ['MUON', 'ANTIMUON'] },
    { upTo: 1.00, types: ['NEUTRINO'] }               // invisible
];

const HADRONS = ['PION', 'KAON'];

const pickOne = (options, rng) => options[Math.floor(rng() * options.length)];

/**
 * Draws one particle species from the collision product mix.
 * @param {() => number} rng uniform random in [0, 1)
 * @returns {string} a ParticleTypes key
 */
export function sampleProductType(rng = Math.random) {
    const r = rng();
    const bucket = PRODUCT_MIX.find(({ upTo }) => r < upTo) ?? PRODUCT_MIX.at(-1);
    return pickOne(bucket.types, rng);
}

function isotropicVelocity(rng) {
    const theta = rng() * Math.PI;        // polar angle
    const phi = rng() * Math.PI * 2;      // azimuthal angle
    const boost = rng() < BOOST_CHANCE ? BOOST_FACTOR : 1;
    const p = (MIN_MOMENTUM + rng() * MOMENTUM_RANGE) * boost;
    return {
        x: p * Math.sin(theta) * Math.cos(phi),
        y: p * Math.sin(theta) * Math.sin(phi),
        z: p * Math.cos(theta)
    };
}

function randomTransverseDirection(rng) {
    const x = rng() - 0.5;
    const y = rng() - 0.5;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length, z: 0 };
}

function jetParticle(direction, sign, rng) {
    const speed = sign * (JET_MIN_SPEED + rng() * JET_SPEED_RANGE);
    const jitter = () => (rng() - 0.5) * JET_SPREAD;
    return {
        typeKey: pickOne(HADRONS, rng),
        velocity: {
            x: direction.x * speed + jitter(),
            y: direction.y * speed + jitter(),
            z: direction.z * speed + jitter()
        },
        isJet: true
    };
}

// Back-to-back hadron jets, common in high-energy collisions.
function backToBackJets(rng) {
    const direction = randomTransverseDirection(rng);
    return [1, -1].flatMap((sign) =>
        Array.from({ length: PARTICLES_PER_JET }, () => jetParticle(direction, sign, rng))
    );
}

/**
 * Generates every particle that emerges from a single collision.
 * @param {() => number} rng uniform random in [0, 1)
 * @returns {Array<{typeKey: string, velocity: {x: number, y: number, z: number}, isJet: boolean}>}
 */
export function generateCollisionProducts(rng = Math.random) {
    const count = MIN_PRODUCTS + Math.floor(rng() * EXTRA_PRODUCTS);
    const products = Array.from({ length: count }, () => ({
        typeKey: sampleProductType(rng),
        velocity: isotropicVelocity(rng),
        isJet: false
    }));
    const jets = rng() < JET_CHANCE ? backToBackJets(rng) : [];
    return [...products, ...jets];
}

/**
 * Vector sum of the transverse momenta of undetectable particles (neutrinos):
 * the Missing Transverse Energy signature.
 * @param {Array<{typeKey: string, velocity: {x: number, y: number}}>} products
 * @returns {{x: number, y: number}}
 */
export function missingTransverseMomentum(products) {
    return products
        .filter(({ typeKey }) => ParticleTypes[typeKey].isInvisible)
        .reduce(
            (met, { velocity }) => ({ x: met.x + velocity.x, y: met.y + velocity.y }),
            { x: 0, y: 0 }
        );
}
