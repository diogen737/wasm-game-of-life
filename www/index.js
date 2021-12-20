// ui imports 
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

import 'bootstrap/js/dist/offcanvas';

/**
 * TODO:
 * - toggle for wrap/limited boundaries
 * - offcanvas for the game's rules
 * - double tap on mobile for predefined counstructs
 */

import { UniverseRenderer } from './components/universe-renderer';


// automatic ticks and rendering

let frameId = null;
const renderLoop = () => {
    renderer.render();
    frameId = requestAnimationFrame(renderLoop);
}

// universe controls

const tickButton = document.getElementById('btn-tick');
const pauseButton = document.getElementById('btn-pause');
const resetDeadButton = document.getElementById('btn-reset-dead');
const resetRandomButton = document.getElementById('btn-reset-random');

// pause/resume ticks
const isPaused = () => {
    return frameId === null;
}

const play = () => {
    pauseButton.querySelector('img').setAttribute('src', '/assets/pause.svg');
    tickButton.disabled = true;
    renderLoop();
}

const pause = () => {
    pauseButton.querySelector('img').setAttribute('src', '/assets/play.svg');
    cancelAnimationFrame(frameId);
    tickButton.disabled = false;
    frameId = null;
}

pauseButton.addEventListener('click', () => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

// manual single tick
tickButton.addEventListener('click', () => {
    renderer.tick();
});

// cell toggles

const modifiers = {
    Alt: {
        enabled: false,
        method: 'glider',
    },
    Shift: {
        enabled: false,
        method: 'pulsar',
    }
};

document.addEventListener('keydown', e => {
    const modifier = modifiers[e.key];
    modifier && (modifier.enabled = true);
});

document.addEventListener('keyup', e => {
    const modifier = modifiers[e.key];
    modifier && (modifier.enabled = false);
});

// toggle a cell that the user has clicked on
document.addEventListener('click', e => {
    let modifier;
    for (let m of Object.values(modifiers)) {
        if (m.enabled) {
            modifier = m.method;
        }
    }

    renderer.handle_canvas_click(e, modifier);
});


// reset all cells to a dead state
resetDeadButton.addEventListener('click', () => {
    renderer.set_all_dead();
});

// reset universe to a random state
resetRandomButton.addEventListener('click', () => {
    renderer.set_random();
});


// create and jumpstart the universe
const renderer = new UniverseRenderer().jumpstart();
play();
