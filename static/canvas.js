const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let x = 50;

function moveMap(step){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle="#00ccff";
  ctx.lineWidth=6;
  ctx.beginPath();
  ctx.moveTo(40, canvas.height/2);
  ctx.lineTo(x, canvas.height/2);
  ctx.stroke();

  ctx.fillStyle="#ffffff";
  ctx.beginPath();
  ctx.arc(x, canvas.height/2, 12, 0, Math.PI*2);
  ctx.fill();

  x += step;

  // obstacle
  ctx.fillStyle="rgba(255,0,0,0.3)";
  ctx.fillRect(x+80, canvas.height/2-30, 30, 60);
}
