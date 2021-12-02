import { Universe, Cell } from "wasm-game-of-life";
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg';

const CELL_SIZE = 10;
const GRID_COLOR = '#aaa';
const DEAD_COLOR = '#fff';
const ALIVE_COLOR = '#333';

const universe = Universe.new();
const uWidth = universe.width();
const uHeight = universe.height();

const canvas = document.getElementById('wasm-canvas');
canvas.height = (CELL_SIZE + 1) * uHeight + 1;
canvas.width = (CELL_SIZE + 1) * uWidth + 1;

const ctx = canvas.getContext('2d');



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

const renderLoop = () => {
    drawGrid();
    drawCells();
    universe.tick();
    // const now = new Date().getTime();
    // while(new Date().getTime() < now + 40){}
    requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);


// Manual ticks on button click

// drawGrid();
// drawCells();
// const tickButton = document.getElementById('btn-next-tick');
// tickButton.addEventListener('click', () => {
//     universe.tick();
//     drawGrid();
//     drawCells();
// });