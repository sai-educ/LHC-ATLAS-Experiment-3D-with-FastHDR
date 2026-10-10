// DOM overlay: particle counter, field readout, collision button and status.

const ELEMENT_IDS = {
    particleCount: 'particle-count',
    fieldStrength: 'field-strength',
    collisionButton: 'collision-button',
    beamStatus: 'beam-status'
};

function requireElement(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`HUD element #${id} is missing from index.html`);
    return element;
}

/**
 * Binds to the overlay elements declared in index.html.
 * @returns {{
 *   setParticleCount: (count: number) => void,
 *   setFieldStrength: (tesla: number) => void,
 *   setCollisionActive: (isActive: boolean) => void,
 *   onTriggerClick: (handler: () => void) => void
 * }}
 */
export function createHud() {
    const el = Object.fromEntries(
        Object.entries(ELEMENT_IDS).map(([key, id]) => [key, requireElement(id)])
    );

    return {
        setParticleCount: (count) => { el.particleCount.textContent = String(count); },
        setFieldStrength: (tesla) => { el.fieldStrength.textContent = tesla.toFixed(1); },
        setCollisionActive: (isActive) => {
            el.collisionButton.disabled = isActive;
            el.beamStatus.hidden = !isActive;
        },
        onTriggerClick: (handler) => el.collisionButton.addEventListener('click', handler)
    };
}

/**
 * Replaces the page with a readable error when the simulation cannot start.
 * @param {string} message
 */
export function showFatalError(message) {
    const panel = document.getElementById('fatal-error');
    if (!panel) return;
    panel.textContent = message;
    panel.hidden = false;
}
