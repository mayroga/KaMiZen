// avatar.js
let avatar = { x: 50, y: 50, size: 20 };
let currentTarget = 0;

function moveAvatar(ctx, path) {
    if (currentTarget < path.length) {
        let target = path[currentTarget];
        let dx = target.x - avatar.x;
        let dy = target.y - avatar.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 2) { currentTarget++; } 
        else { avatar.x += dx * 0.02; avatar.y += dy * 0.02; }
        drawAvatar(ctx);
        requestAnimationFrame(() => moveAvatar(ctx, path));
    }
}

function drawAvatar(ctx) {
    ctx.beginPath();
    ctx.arc(avatar.x, avatar.y, avatar.size, 0, 2*Math.PI);
    ctx.fillStyle = "green";
    ctx.fill();
}
