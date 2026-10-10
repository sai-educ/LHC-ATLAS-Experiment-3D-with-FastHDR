// Particle species produced in collisions.
// Each carries stopRadius (transverse r at which it is absorbed) and
// showerType ('EM', 'HAD', or null for penetrating / invisible particles),
// which drive the layer-accurate calorimeter physics.

export const ParticleTypes = Object.freeze({
    PHOTON: {
        color: 0xaaff44, charge: 0, mass: 0, name: 'Photon',
        stopRadius: 100, showerType: 'EM', emissiveIntensity: 3.0
    },
    ELECTRON: {
        color: 0x44aaff, charge: -1, mass: 0.511, name: 'Electron',
        stopRadius: 100, showerType: 'EM', emissiveIntensity: 2.5
    },
    POSITRON: {
        color: 0x44ffee, charge: 1, mass: 0.511, name: 'Positron',
        stopRadius: 100, showerType: 'EM', emissiveIntensity: 2.5
    },
    MUON: {
        // Muons are minimum-ionising — they penetrate all calorimeters and
        // are only stopped in / beyond the muon spectrometer (r ≈ 240).
        color: 0xcc44ff, charge: -1, mass: 105.7, name: 'Muon',
        stopRadius: 240, showerType: null, emissiveIntensity: 3.5
    },
    ANTIMUON: {
        color: 0xff88ff, charge: 1, mass: 105.7, name: 'Anti-muon',
        stopRadius: 240, showerType: null, emissiveIntensity: 3.5
    },
    PION: {
        // Charged pions are hadrons — they shower in the hadronic calorimeter.
        color: 0xff6600, charge: 1, mass: 139.6, name: 'Pion',
        stopRadius: 150, showerType: 'HAD', emissiveIntensity: 2.0
    },
    KAON: {
        color: 0xff9900, charge: 1, mass: 493.7, name: 'Kaon',
        stopRadius: 150, showerType: 'HAD', emissiveIntensity: 2.0
    },
    NEUTRINO: {
        // Neutrinos escape undetected — no calorimeter hit. Their momentum
        // shows up only as Missing Transverse Energy (MET).
        color: 0xffff00, charge: 0, mass: 0, name: 'Neutrino',
        stopRadius: 99999, showerType: null, emissiveIntensity: 0,
        isInvisible: true
    }
});
