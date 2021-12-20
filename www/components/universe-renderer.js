import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg.wasm';
import { Fps } from './fps';


export class UniverseRenderer {
    constructor() {
        this.fps = new Fps();
        
        // setup the universe 

        const docStyles = getComputedStyle(document.body);
        this.GRID_COLOR = docStyles.getPropertyValue('--theme-grid');
        this.DEAD_COLOR = docStyles.getPropertyValue('--theme-bg');
        this.ALIVE_COLOR = docStyles.getPropertyValue('--theme-cell-alive');;
        this.CELL_SIZE = 7;

        // make canvas fill the screen
        const canvasContainer = document.querySelector('.canvas-container');
        this.uWidth = ~~(canvasContainer.clientWidth / (this.CELL_SIZE + 1));
        this.uHeight = ~~(canvasContainer.clientHeight / (this.CELL_SIZE + 1));
        // this.uWidth = 300;
        // this.uHeight = 300;

        this.canvas = document.getElementById('wasm-canvas');
        this.canvas.height = (this.CELL_SIZE + 1) * this.uHeight + 1;
        this.canvas.width = (this.CELL_SIZE + 1) * this.uWidth + 1;
        this.ctx = this.canvas.getContext('2d');
    }

    jumpstart() {
        this.universe = Universe.new(this.uWidth, this.uHeight);
        // universe.spawn_glider(40, 40);
        this.universe.set_random();
        
        this.drawGrid();
        this.drawCells();

        return this;
    }

    render() {
        this.fps.render();
        this.universe.tick();
        this.drawCells();
    }

    tick() {
        this.universe.tick();
        this.drawCells();
    }

    set_all_dead() {
        this.universe.set_all_dead();
        this.drawCells();
    }

    set_random() {
        this.universe.set_random();
        this.drawCells();
    }


    handle_canvas_click(clickEvent, modifier) {
        if (clickEvent.srcElement == this.canvas) {
            const boundingRect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / boundingRect.width;
            const scaleY = this.canvas.height / boundingRect.height;
            const canvasLeft = (clickEvent.clientX - boundingRect.left) * scaleX;
            const canvasTop = (clickEvent.clientY - boundingRect.top) * scaleY;

            const row = Math.min(Math.floor(canvasTop / (this.CELL_SIZE + 1)), this.uHeight - 1);
            const col = Math.min(Math.floor(canvasLeft / (this.CELL_SIZE + 1)),this.uWidth - 1);

            switch (modifier) {
                case 'glider':
                    this.universe.spawn_glider(row, col);
                    break;
                case 'pulsar':
                    this.universe.spawn_pulsar(row, col);
                    break;
                default:
                    this.universe.toggle_cell(row, col);
            }

            this.drawCells();
        }
    }

    /**
     * rendering logic
     */
    drawGrid() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.GRID_COLOR;

        // vertical lines
        for (let i = 0; i <= this.uWidth; ++i) {
            const targetX = (this.CELL_SIZE + 1) * i + .5;
            const targetY = (this.CELL_SIZE + 1) * this.uHeight + .5;
            this.ctx.moveTo(targetX, 0);
            this.ctx.lineTo(targetX, targetY);
        }

        // horizontal lines
        for (let i = 0; i <= this.uHeight; ++i) {
            const targetX = (this.CELL_SIZE + 1) * this.uWidth + .5;
            const targetY = (this.CELL_SIZE + 1) * i + .5;
            this.ctx.moveTo(0, targetY);
            this.ctx.lineTo(targetX, targetY);
        }

        this.ctx.stroke();
    }

    drawCells() {
        // get all cells for reference
        const cellsPtr = this.universe.cells();
        const cells = new Uint8Array(memory.buffer, cellsPtr, this.uHeight * this.uWidth);

        // get cells diff from previous tick
        const cellsDiffPtr = this.universe.cells_diff();
        const cellsDiffLen = this.universe.cells_diff_len();
        const cellsDiff = new Uint32Array(memory.buffer, cellsDiffPtr, cellsDiffLen);

        // separate alive & dead cells for rendering optimization (fillStyle takes a lot of time)
        const aliveCells = [];
        const deadCells = [];
        for (let idx of cellsDiff) {
            const col = Math.floor(idx % this.uWidth);
            const row = Math.floor(idx / this.uWidth);
            if (cells[idx] === Cell.Alive) {
                aliveCells.push([col, row]);
            } else {
                deadCells.push([col, row]);
            }
        }

        this.ctx.beginPath();

        // alive cells
        this.ctx.fillStyle = this.ALIVE_COLOR;
        for (let [col, row] of aliveCells) {
            this.ctx.fillRect(
                (this.CELL_SIZE + 1) * col + 1,
                (this.CELL_SIZE + 1) * row + 1,
                this.CELL_SIZE,
                this.CELL_SIZE
            );
        }

        // dead cells
        this.ctx.fillStyle = this.DEAD_COLOR;
        for (let [col, row] of deadCells) {
            this.ctx.fillRect(
                (this.CELL_SIZE + 1) * col + 1,
                (this.CELL_SIZE + 1) * row + 1,
                this.CELL_SIZE,
                this.CELL_SIZE
            );
        }

        this.ctx.stroke();
    }
}
