// Entry point: builds the scene, wires the UI and runs the render loop.

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { createDefaultParams, FIXED_TIMESTEP } from './config.js';
import { createStage } from './scene/stage.js';
import { createDetector } from './detector/index.js';
import { createTraceLayer } from './effects/traces.js';
import { createCollisionSimulation } from './simulation.js';
import { createHud, showFatalError } from './ui/hud.js';
import { createControlPanel } from './ui/controlPanel.js';

function start() {
    const container = document.getElementById('container');
    if (!container) throw new Error('#container is missing from index.html');

    const params = createDefaultParams();
    const magneticField = new THREE.Vector3(0, 0, params.magneticFieldStrength);

    const stage = createStage(container, params);
    const detector = createDetector();
    stage.scene.add(detector);
    stage.frame(detector);

    const hud = createHud();
    const traces = createTraceLayer(stage.scene);
    traces.setVisible(params.showTraces);
    const simulation = createCollisionSimulation({
        scene: stage.scene, params, magneticField, hud
    });

    createControlPanel({ params, stage, simulation, traces, magneticField, hud });

    hud.setFieldStrength(params.magneticFieldStrength);
    hud.setParticleCount(0);
    hud.onTriggerClick(simulation.trigger);

    window.addEventListener('resize', stage.resize);
    const keyActions = { c: simulation.trigger, r: stage.resetView };
    window.addEventListener('keydown', (event) => {
        if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
        keyActions[event.key.toLowerCase()]?.();
    });

    stage.renderer.setAnimationLoop(() => {
        simulation.update(FIXED_TIMESTEP);
        if (params.showTraces) traces.update(simulation.particles, simulation.beams);
        stage.render();
    });
}

if (!WebGL.isWebGLAvailable()) {
    showFatalError('This simulation needs WebGL, which your browser or device does not support.');
} else {
    try {
        start();
    } catch (error) {
        console.error('Failed to start the ATLAS simulation:', error);
        showFatalError('Something went wrong while starting the simulation. Try reloading the page.');
    }
}
