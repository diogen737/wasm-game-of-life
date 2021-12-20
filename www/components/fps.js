export class Fps {
    constructor() {
        this.fps = document.querySelector('.fps');
        this.buffer = 500;
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

