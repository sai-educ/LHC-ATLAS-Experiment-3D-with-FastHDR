import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ParticleTypes } from '../src/physics/particleTypes.js';
import { lorentzVelocityKick } from '../src/physics/lorentz.js';
import { isAbsorbed, hasLeftDetector } from '../src/physics/absorption.js';
import {
    sampleProductType,
    generateCollisionProducts,
    missingTransverseMomentum
} from '../src/physics/collisionEvent.js';
import { PARTICLE_MAX_LIFETIME_FRAMES } from '../src/config.js';

// Returns the given values in order, cycling when exhausted.
const sequenceRng = (values) => {
    let i = 0;
    return () => values[i++ % values.length];
};

// Small deterministic PRNG (mulberry32) so event generation is reproducible.
const seededRng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

// ── Lorentz force ───────────────────────────────────────────────────────────

test('neutral particles receive no Lorentz kick', () => {
    const kick = lorentzVelocityKick({ x: 10, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }, 0, 0);
    assert.deepEqual(kick, { x: 0, y: 0, z: 0 });
});

test('opposite charges are bent in opposite directions', () => {
    const velocity = { x: 10, y: 0, z: 0 };
    const field = { x: 0, y: 0, z: 2 };
    const negative = lorentzVelocityKick(velocity, field, -1, 105.7);
    const positive = lorentzVelocityKick(velocity, field, 1, 105.7);

    assert.ok(negative.y > 0);
    assert.equal(positive.y, -negative.y);
});

test('Lorentz kick is perpendicular to the velocity', () => {
    const velocity = { x: 3, y: -4, z: 7 };
    const kick = lorentzVelocityKick(velocity, { x: 0, y: 0, z: 2 }, 1, 0.511);
    assert.ok(Math.abs(dot(kick, velocity)) < 1e-9);
});

test('heavier particles curve less than lighter ones', () => {
    const velocity = { x: 10, y: 0, z: 0 };
    const field = { x: 0, y: 0, z: 2 };
    const electron = lorentzVelocityKick(velocity, field, -1, ParticleTypes.ELECTRON.mass);
    const muon = lorentzVelocityKick(velocity, field, -1, ParticleTypes.MUON.mass);
    assert.ok(Math.abs(electron.y) > Math.abs(muon.y));
});

// ── Detector absorption ─────────────────────────────────────────────────────

test('electrons are absorbed once they pass the EM calorimeter radius', () => {
    assert.equal(isAbsorbed({ x: 99, y: 0, z: 0 }, ParticleTypes.ELECTRON), false);
    assert.equal(isAbsorbed({ x: 101, y: 0, z: 0 }, ParticleTypes.ELECTRON), true);
});

test('muons penetrate the calorimeters and stop only beyond the spectrometer', () => {
    assert.equal(isAbsorbed({ x: 0, y: 200, z: 0 }, ParticleTypes.MUON), false);
    assert.equal(isAbsorbed({ x: 0, y: 241, z: 0 }, ParticleTypes.MUON), true);
});

test('off-axis particles are absorbed by the end-cap plane', () => {
    assert.equal(isAbsorbed({ x: 20, y: 0, z: 216 }, ParticleTypes.PION), true);
    assert.equal(isAbsorbed({ x: 20, y: 0, z: -216 }, ParticleTypes.PION), true);
});

test('particles still inside the beam pipe pass through the end-cap plane', () => {
    assert.equal(isAbsorbed({ x: 2, y: 2, z: 216 }, ParticleTypes.PION), false);
});

test('particles leave the detector when too far out or too old', () => {
    assert.equal(hasLeftDetector({ x: 0, y: 0, z: 100 }, 10), false);
    assert.equal(hasLeftDetector({ x: 0, y: 0, z: 321 }, 10), true);
    assert.equal(hasLeftDetector({ x: 0, y: 0, z: 0 }, PARTICLE_MAX_LIFETIME_FRAMES + 1), true);
});

// ── Collision event generation ──────────────────────────────────────────────

test('sampleProductType follows the LHC-inspired product mix', () => {
    assert.equal(sampleProductType(sequenceRng([0.10, 0.0])), 'PION');
    assert.equal(sampleProductType(sequenceRng([0.10, 0.9])), 'KAON');
    assert.equal(sampleProductType(sequenceRng([0.50])), 'PHOTON');
    assert.equal(sampleProductType(sequenceRng([0.70, 0.0])), 'ELECTRON');
    assert.equal(sampleProductType(sequenceRng([0.70, 0.9])), 'POSITRON');
    assert.equal(sampleProductType(sequenceRng([0.80, 0.0])), 'MUON');
    assert.equal(sampleProductType(sequenceRng([0.80, 0.9])), 'ANTIMUON');
    assert.equal(sampleProductType(sequenceRng([0.95])), 'NEUTRINO');
});

test('every generated product has a known type and a finite velocity', () => {
    const products = generateCollisionProducts(seededRng(42));

    assert.ok(products.length >= 30 && products.length <= 59);
    for (const { typeKey, velocity } of products) {
        assert.ok(typeKey in ParticleTypes, `unknown type ${typeKey}`);
        assert.ok([velocity.x, velocity.y, velocity.z].every(Number.isFinite));
    }
});

test('generated jets are back-to-back hadrons in the transverse plane', () => {
    // Find a seed whose event includes jets (70% of events do).
    const products = [1, 2, 3, 4, 5, 6, 7, 8]
        .map((seed) => generateCollisionProducts(seededRng(seed)))
        .find((event) => event.some((p) => p.isJet));
    assert.ok(products, 'expected at least one seeded event with jets');

    const jets = products.filter((p) => p.isJet);
    assert.equal(jets.length, 10);
    assert.ok(jets.every((p) => p.typeKey === 'PION' || p.typeKey === 'KAON'));

    const [first, ...rest] = jets;
    const opposite = rest.filter((p) => dot(p.velocity, first.velocity) < 0);
    assert.equal(opposite.length, 5);
});

test('event generation is reproducible for the same random source', () => {
    assert.deepEqual(
        generateCollisionProducts(seededRng(7)),
        generateCollisionProducts(seededRng(7))
    );
});

test('missing transverse momentum sums only invisible particles', () => {
    const products = [
        { typeKey: 'NEUTRINO', velocity: { x: 3, y: 4, z: 9 } },
        { typeKey: 'NEUTRINO', velocity: { x: 1, y: -1, z: -2 } },
        { typeKey: 'MUON', velocity: { x: 100, y: 100, z: 0 } }
    ];
    assert.deepEqual(missingTransverseMomentum(products), { x: 4, y: 3 });
});

test('missing transverse momentum is zero when there are no neutrinos', () => {
    const products = [{ typeKey: 'PHOTON', velocity: { x: 5, y: 5, z: 5 } }];
    assert.deepEqual(missingTransverseMomentum(products), { x: 0, y: 0 });
});
