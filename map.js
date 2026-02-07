// map.js
let nodes = [];
let path = [];

function generateMap(canvas) {
    nodes = [];
    path = [];
    const w = canvas.width;
    const h = canvas.height;

    // Crear 8 nodos de riqueza
    for (let i = 0; i < 8; i++) {
        const x = 100 + i * (w - 200) / 7;
        const y = 100 + Math.random() * (h - 200);
        nodes.push({ x, y, r: 20 });
        path.push({ x, y });
    }
}

function drawMap(ctx, avatar) {
    // Limpiar canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Dibujar líneas del camino
    ctx.beginPath();
    ctx.moveTo(avatar.x, avatar.y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = "#00f";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Dibujar nodos
    nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI);
        ctx.fillStyle = "gold";
        ctx.fill();
        ctx.strokeStyle = "orange";
        ctx.stroke();
    });
}
