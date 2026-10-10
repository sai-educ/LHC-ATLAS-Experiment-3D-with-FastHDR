import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fitDistance } from '../src/scene/framing.js';

const RADIUS = 300;
const FOV = 60;

test('on a landscape screen the vertical field of view limits the fit', () => {
    // sin(30°) = 0.5, so a 300-unit sphere needs 600 units of distance.
    assert.ok(Math.abs(fitDistance(RADIUS, FOV, 16 / 9) - 600) < 1e-9);
});

test('on a portrait screen the camera backs off so the width still fits', () => {
    const landscape = fitDistance(RADIUS, FOV, 16 / 9);
    const portrait = fitDistance(RADIUS, FOV, 9 / 19.5);
    assert.ok(portrait > landscape * 1.5);
});

test('padding scales the distance proportionally', () => {
    const tight = fitDistance(RADIUS, FOV, 1.5, 1);
    const roomy = fitDistance(RADIUS, FOV, 1.5, 1.3);
    assert.ok(Math.abs(roomy / tight - 1.3) < 1e-9);
});

test('rejects sizes that cannot be framed', () => {
    assert.throws(() => fitDistance(0, FOV, 1.5), RangeError);
    assert.throws(() => fitDistance(RADIUS, 0, 1.5), RangeError);
    assert.throws(() => fitDistance(RADIUS, FOV, 0), RangeError);
});
