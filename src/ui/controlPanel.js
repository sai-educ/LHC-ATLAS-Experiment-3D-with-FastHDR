import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Below this width the panel would cover the scene, so it starts collapsed.
const COMPACT_LAYOUT_MAX_WIDTH = 768;

/**
 * lil-gui panel for rendering, physics and display settings.
 * @param {object} deps
 * @param {object} deps.params settings object (mutated by lil-gui)
 * @param {object} deps.stage from createStage()
 * @param {object} deps.simulation from createCollisionSimulation()
 * @param {object} deps.traces from createTraceLayer()
 * @param {THREE.Vector3} deps.magneticField
 * @param {object} deps.hud from createHud()
 */
export function createControlPanel({ params, stage, simulation, traces, magneticField, hud }) {
    const gui = new GUI();

    const rendering = gui.addFolder('Rendering');
    rendering.add(params, 'exposure', 0, 10)
        .onChange((v) => { stage.renderer.toneMappingExposure = v; });
    rendering.add(params, 'bloomStrength', 0, 5)
        .onChange((v) => { stage.bloomPass.strength = v; });
    rendering.add(params, 'bloomThreshold', 0, 1)
        .onChange((v) => { stage.bloomPass.threshold = v; });
    rendering.add(params, 'bloomRadius', 0, 2)
        .onChange((v) => { stage.bloomPass.radius = v; });
    rendering.add(params, 'particleGlow', 0.5, 5)
        .onChange((v) => simulation.setGlow(v));

    const physics = gui.addFolder('Physics');
    physics.add(params, 'magneticFieldStrength', 0, 5)
        .onChange((v) => {
            magneticField.z = v;
            hud.setFieldStrength(v);
        });
    physics.add(params, 'collisionEnergy', 7, 14).name('Collision Energy (TeV)');

    const display = gui.addFolder('Display');
    display.add(params, 'showTraces').onChange((v) => traces.setVisible(v));
    display.add(params, 'traceLength', 10, 200, 1);
    display.add(params, 'autoRotate').onChange((v) => { stage.controls.autoRotate = v; });
    display.add(params, 'showGrid').onChange((v) => { stage.grid.visible = v; });
    display.add({ resetView: stage.resetView }, 'resetView').name('Reset View (R)');

    gui.open(window.innerWidth > COMPACT_LAYOUT_MAX_WIDTH);
    return gui;
}
