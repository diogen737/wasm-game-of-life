// ui imports 
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

import 'bootstrap/js/dist/offcanvas';

/**
 * TODO:
 * - toggle for wrap/limited boundaries
 * - proper universe resize
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

// reset universe to dead state
resetDeadButton.addEventListener('click', () => {
    renderer.set_all_dead();
});

// reset universe to a random state
resetRandomButton.addEventListener('click', () => {
    renderer.set_random();
});


// pattern-spawning modifiers
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

const clearModifiers = () => {
    Object.values(modifiers).forEach(m => m.enabled = false);
}

document.addEventListener('keydown', e => {
    const modifier = modifiers[e.key];
    modifier && (modifier.enabled = true);
});

document.addEventListener('keyup', e => {
    clearModifiers();
});


const TAP_WINDOW = 350;
let tapCount = 0;
let lastEvent;
document.addEventListener('click', e => {
    // handle multiple taps
    if (e.pointerType === 'touch') {
        if (tapCount === 0) {
            // open tap window
            setTimeout(() => {
                // make sure only one modifier is set
                clearModifiers();
                // map the number of taps to the keyboard modifiers
                switch (tapCount) {
                    case 2:
                        modifiers.Alt.enabled = true;
                        break;
                    case 3:
                        modifiers.Shift.enabled = true;
                        break;
                }

                fireClick(lastEvent);
                // cleanup before closing tap window
                clearModifiers();
                tapCount = 0;
            }, TAP_WINDOW);
        }

        tapCount += 1;
        lastEvent = e;
    } else {
        fireClick(e);
    }
});

const fireClick = (e) => {
    // take first enambled modifier
    let modifier;
    for (let m of Object.values(modifiers)) {
        if (m.enabled) {
            modifier = m.method;
        }
    }

    renderer.handle_canvas_click(e, modifier);
}


// create and jumpstart the universe
const renderer = new UniverseRenderer().jumpstart();
play();
