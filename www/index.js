import { Universe } from "wasm-game-of-life";

const canvas = document.getElementById('wasm-canvas');
const universe = Universe.new();

const tickButton = document.getElementById('btn-next-tick');

canvas.textContent = universe.render();
tickButton.addEventListener('click', () => {
    console.log('click');
    universe.tick();
    canvas.textContent = universe.render();
})


const renderLoop = () => {
    canvas.textContent = universe.render();
    universe.tick();

    const now = new Date().getTime();
    while(new Date().getTime() < now + 100){}

    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

