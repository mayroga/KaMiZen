// obstacles.js
let obstacles = [];

function generateObstacles(canvas) {
    obstacles = [];
    for (let i = 0; i < 6; i++) {
        obstacles.push({
            x: 150 + i * (canvas.width - 300) / 5,
            y: 100 + Math.random() * (canvas.height - 200),
            r: 15,
            type: ['miedo','odio','duda','estres'][Math.floor(Math.random()*4)]
        });
    }
}

function drawObstacles(ctx) {
    obstacles.forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, 2*Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
    });
}
