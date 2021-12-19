import styles from './styles/index.css';

import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg.wasm';


// setup the universe 

const docStyles = getComputedStyle(document.body);

const GRID_COLOR = docStyles.getPropertyValue('--theme-grid');
const DEAD_COLOR = docStyles.getPropertyValue('--theme-bg');
const ALIVE_COLOR = docStyles.getPropertyValue('--theme-cell-alive');;
const CELL_SIZE = 5;

const canvasContainer = document.querySelector('.canvas-container');

const uWidth = ~~(canvasContainer.clientWidth / (CELL_SIZE + 1));
// const uWidth = 300;
const uHeight = ~~(canvasContainer.clientHeight / (CELL_SIZE + 1));
// const uHeight = 300;

const canvas = document.getElementById('wasm-canvas');
const ctx = canvas.getContext('2d');
canvas.height = (CELL_SIZE + 1) * uHeight + 1;
canvas.width = (CELL_SIZE + 1) * uWidth + 1;


// rendering logic

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // vertical lines
    for (let i = 0; i <= uWidth; ++i) {
        const targetX = (CELL_SIZE + 1) * i + .5;
        const targetY = (CELL_SIZE + 1) * uHeight + .5;
        ctx.moveTo(targetX, 0);
        ctx.lineTo(targetX, targetY);
    }

    // horizontal lines
    for (let i = 0; i <= uHeight; ++i) {
        const targetX = (CELL_SIZE + 1) * uWidth + .5;
        const targetY = (CELL_SIZE + 1) * i + .5;
        ctx.moveTo(0, targetY);
        ctx.lineTo(targetX, targetY);
    }

    ctx.stroke();
}

const drawCells = () => {
    // get all cells for reference
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, uHeight * uWidth);

    // get cells diff from previous tick
    const cellsDiffPtr = universe.cells_diff();
    const cellsDiffLen = universe.cells_diff_len();
    const cellsDiff = new Uint32Array(memory.buffer, cellsDiffPtr, cellsDiffLen);

    // separate alive & dead cells for rendering optimization (fillStyle takes a lot of time)
    const aliveCells = [];
    const deadCells = [];
    for (let idx of cellsDiff) {
        const col = Math.floor(idx % uWidth);
        const row = Math.floor(idx / uWidth);
        if (cells[idx] === Cell.Alive) {
            aliveCells.push([col, row]);
        } else {
            deadCells.push([col, row]);
        }
    }

    ctx.beginPath();

    // alive cells
    ctx.fillStyle = ALIVE_COLOR;
    for (let [col, row] of aliveCells) {
        ctx.fillRect(
            (CELL_SIZE + 1) * col + 1,
            (CELL_SIZE + 1) * row + 1,
            CELL_SIZE,
            CELL_SIZE
        );
    }

    // dead cells
    ctx.fillStyle = DEAD_COLOR;
    for (let [col, row] of deadCells) {
        ctx.fillRect(
            (CELL_SIZE + 1) * col + 1,
            (CELL_SIZE + 1) * row + 1,
            CELL_SIZE,
            CELL_SIZE
        );
    }

    ctx.stroke();
}


const fps = new class {
    constructor() {
        this.fps = document.querySelector('.fps');
        this.buffer = 2000;
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }

    render() {
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        // save only last N readings
        this.frames.push(fps);
        if (this.frames.length > this.buffer) {
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
&nbsp;&nbsp;Min: ${min.toFixed(2)}<br>
&nbsp;&nbsp;Max: ${max.toFixed(2)}<br>
&nbsp;&nbsp;Avg: ${avg.toFixed(2)}`;
    }
}


// automatic ticks and rendering

let frameId = null;
const renderLoop = () => {
    fps.render();
    universe.tick();
    drawCells();
    frameId = requestAnimationFrame(renderLoop);
}

// universe controls

const tickButton = document.getElementById('btn-next-tick');
const pauseButton = document.getElementById('btn-pause');
const resetDeadButton = document.getElementById('btn-reset-dead');
const resetRandomButton = document.getElementById('btn-reset-random');

// pause/resume ticks
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
    universe.set_all_dead();
    drawCells();
});

// reset universe to a random state
resetRandomButton.addEventListener('click', () => {
    universe.set_random();
    drawCells();
});


// create and jumpstart the universe

let universe = Universe.new(uWidth, uHeight);
// universe.spawn_glider(40, 40);
universe.set_random();

drawGrid();
drawCells();
play();
