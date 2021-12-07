import styles from './styles/index.css';

import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg.wasm';

const CELL_SIZE = 10;
const GRID_COLOR = '#aaa';
const DEAD_COLOR = '#fff';
const ALIVE_COLOR = '#333';


const uWidth = ~~(window.innerWidth / (CELL_SIZE + 1));
const uHeight = ~~(window.innerHeight / (CELL_SIZE + 1));
let universe = Universe.new(uWidth, uHeight);

const canvas = document.getElementById('wasm-canvas');
const ctx = canvas.getContext('2d');
canvas.height = (CELL_SIZE + 1) * uHeight + 1;
canvas.width = (CELL_SIZE + 1) * uWidth + 1;


// Rendering logic

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // vertical lines
    for (let i = 0; i <= uWidth; ++i) {
        const targetX = (CELL_SIZE + 1) * i + 1;
        const targetY = (CELL_SIZE + 1) * uHeight + 1;
        ctx.moveTo(targetX, 0);
        ctx.lineTo(targetX, targetY);
    }

    // horizontal lines
    for (let i = 0; i <= uHeight; ++i) {
        const targetX = (CELL_SIZE + 1) * uWidth + 1;
        const targetY = (CELL_SIZE + 1) * i + 1;
        ctx.moveTo(0, targetY);
        ctx.lineTo(targetX, targetY);
    }

    ctx.stroke();
}

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, uHeight * uWidth);

    ctx.beginPath();
    for (let row = 0; row < uHeight; ++row) {
        for (let col = 0; col < uWidth; ++col) {
            const idx = universe.get_index(row, col);
            ctx.fillStyle = cells[idx] === Cell.Dead
                ? DEAD_COLOR
                : ALIVE_COLOR;

            ctx.fillRect(
                (CELL_SIZE + 1) * col + 1,
                (CELL_SIZE + 1) * row + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }
    ctx.stroke();
}

// Automatic ticks and rendering

let frameId = null;
const renderLoop = () => {
    universe.tick();
    drawCells();
    // const now = new Date().getTime();
    // while(new Date().getTime() < now + 100){}

    frameId = requestAnimationFrame(renderLoop);
}

// Game controls

const tickButton = document.getElementById('btn-next-tick');
const pauseButton = document.getElementById('btn-pause');
const resetDeadButton = document.getElementById('btn-reset-dead');
const resetRandomButton = document.getElementById('btn-reset-random');

const isPaused = () => {
    return frameId === null;
}

const play = () => {
    pauseButton.textContent = 'Pause';
    tickButton.disabled = true;
    renderLoop();
}

const pause = () => {
    pauseButton.textContent = 'Play';
    cancelAnimationFrame(frameId);
    tickButton.disabled = false;
    frameId = null;
}

// pause/resume ticks
pauseButton.addEventListener('click', () => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

// manual single tick
tickButton.addEventListener('click', () => {
    universe.tick();
    drawCells();
});

// cell toggle modifiers

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
canvas.addEventListener('click', e => {
    const boundingRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (e.clientX - boundingRect.left) * scaleX;
    const canvasTop = (e.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), uHeight - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), uWidth - 1);

    // check keyboard modifiers
    const patternSpawned = Object.values(modifiers).some(m => {
        if (m.enabled) {
            universe[`spawn_${m.method}`](row, col);
            return true;
        }
    });

    // if none were pressed do regular cell toggle
    if (!patternSpawned) {
        universe.toggle_cell(row, col);
    }

    drawCells();
});


// reset all cells to a dead state
resetDeadButton.addEventListener('click', () => {
    // setting width resets all cells to a dead state
    universe.set_width(uWidth);
    drawCells();
});

// reset universe to a random state
resetRandomButton.addEventListener('click', () => {
    universe = Universe.new();
    drawCells();
});


// Jumpstart the game

drawGrid();
drawCells();
play();
