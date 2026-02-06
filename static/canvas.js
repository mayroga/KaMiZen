const canvas = document.getElementById("lifeCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let nodes = [];

function generateLifeMap() {
  nodes = [];
  for (let i = 0; i < 20; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 10 + Math.random() * 30
    });
  }
}

function drawMap() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100,200,255,0.6)";
    ctx.fill();
  });
  requestAnimationFrame(drawMap);
}

generateLifeMap();
drawMap();
