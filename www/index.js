import styles from './styles/index.css';

import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg.wasm';

const CELL_SIZE = 10;
const GRID_COLOR = '#aaa';
const DEAD_COLOR = '#fff';
const ALIVE_COLOR = '#333';

const canvasContainer = document.querySelector('.canvas-container');

const uWidth = ~~(canvasContainer.clientWidth / (CELL_SIZE + 1));
const uHeight = ~~(canvasContainer.clientHeight / (CELL_SIZE + 1));
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
    // alive cells
    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < uHeight; ++row) {
        for (let col = 0; col < uWidth; ++col) {
            const idx = universe.get_index(row, col);
            if (cells[idx] === Cell.Alive) {
                ctx.fillRect(
                    (CELL_SIZE + 1) * col + 1,
                    (CELL_SIZE + 1) * row + 1,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }

    // alive cells
    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < uHeight; ++row) {
        for (let col = 0; col < uWidth; ++col) {
            const idx = universe.get_index(row, col);
            if (cells[idx] === Cell.Dead) {
                ctx.fillRect(
                    (CELL_SIZE + 1) * col + 1,
                    (CELL_SIZE + 1) * row + 1,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }
    ctx.stroke();
}


const fps = new class {
    constructor() {
        this.fps = document.querySelector('.fps');
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }

    render() {
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        // save only last 100 readings
        this.frames.push(fps);
        if (this.frames.length > 5000) {
            this.frames.shift();
        }

        // find min, max, avg fps
        let min = Infinity;
        let max = -Infinity;
        let avg = 0;
        for (let i = 0; i < this.frames.length; ++i) {
            const frame = this.frames[i];
            avg += frame;
            min = Math.min(frame, min);
            max = Math.max(frame, max);
        }
        avg = avg / this.frames.length;

        this.fps.innerHTML = `
FPS:<br>
  Min: ${min.toFixed(2)},<br>
  Max: ${max.toFixed(2)},<br>
  Avg: ${avg.toFixed(2)}`;
    }
}


// Automatic ticks and rendering

let frameId = null;
const renderLoop = () => {
    fps.render();
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
    universe = Universe.new(uWidth, uHeight);
    drawCells();
});


// Jumpstart the game

drawGrid();
drawCells();
play();
