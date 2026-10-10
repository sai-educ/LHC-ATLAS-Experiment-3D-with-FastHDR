import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import Stats from 'three/addons/libs/stats.module.js';
import { DEFAULT_VIEW } from '../config.js';
import { fitDistance } from './framing.js';

const MIN_ORBIT_DISTANCE = 50;
const MAX_ORBIT_DISTANCE_FACTOR = 2;   // how far beyond the default view users may zoom out

function createRenderer(params) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = params.exposure;
    return renderer;
}

function createControls(camera, domElement, params) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = MIN_ORBIT_DISTANCE;
    controls.autoRotate = params.autoRotate;
    controls.autoRotateSpeed = 0.5;
    return controls;
}

function addLights(scene) {
    scene.add(new THREE.AmbientLight(0x404040, 1.0));

    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(100, 100, 50);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, {
        near: 0.1, far: 500, left: -250, right: 250, top: 250, bottom: -250
    });
    scene.add(sun);

    // Cyan glow from the interaction point.
    scene.add(new THREE.PointLight(0x00ffff, 2, 300));
}

function addHelpers(scene, params) {
    const grid = new THREE.GridHelper(400, 40, 0x444444, 0x222222);
    grid.name = 'grid';
    grid.position.y = -200;
    grid.visible = params.showGrid;
    scene.add(grid);

    scene.add(new THREE.AxesHelper(100));
    return grid;
}

/**
 * Camera, renderer, HDR bloom pipeline, controls, lights and helpers.
 * @param {HTMLElement} container element the canvas is appended to
 * @param {object} params settings from createDefaultParams()
 */
export function createStage(container, params) {
    const camera = new THREE.PerspectiveCamera(
        DEFAULT_VIEW.fieldOfView, window.innerWidth / window.innerHeight, 0.1, 5000
    );

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000);

    const renderer = createRenderer(params);
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        params.bloomStrength,
        params.bloomRadius,
        params.bloomThreshold
    );
    composer.addPass(bloomPass);

    const controls = createControls(camera, renderer.domElement, params);
    addLights(scene);
    const grid = addHelpers(scene, params);

    const stats = new Stats();
    container.appendChild(stats.dom);

    const resize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    };

    const viewDirection = new THREE.Vector3(...DEFAULT_VIEW.direction).normalize();
    let framedSphere = null;

    // Moves the camera back to the default shot of the framed object.
    const resetView = () => {
        if (!framedSphere) return;
        const distance = fitDistance(
            framedSphere.radius, camera.fov, camera.aspect, DEFAULT_VIEW.padding
        );
        camera.position.copy(framedSphere.center).addScaledVector(viewDirection, distance);
        controls.target.copy(framedSphere.center);
        controls.maxDistance = distance * MAX_ORBIT_DISTANCE_FACTOR;
        scene.fog.near = distance * DEFAULT_VIEW.fogNear;
        scene.fog.far = distance * DEFAULT_VIEW.fogFar;
        controls.update();
    };

    // Fits `object` (e.g. the detector) on screen and remembers it for resets.
    const frame = (object) => {
        framedSphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
        resetView();
    };

    const render = () => {
        controls.update();
        composer.render();
        stats.update();
    };

    return { scene, camera, renderer, composer, bloomPass, controls, grid, resize, render, frame, resetView };
}
