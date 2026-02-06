const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let x = 50;
let y = canvas.height/2;

function moveMap(step, mini_world, obstacle, choice, mini_game){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Curved line for life path
  ctx.strokeStyle="#00ccff";
  ctx.lineWidth=6;
  ctx.beginPath();
  ctx.moveTo(40, canvas.height/2);
  ctx.quadraticCurveTo(x+100, y-50, x+step, y);
  ctx.stroke();
  
  x += step;

  // Player marker
  ctx.fillStyle="#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI*2);
  ctx.fill();

  // Obstacle
  if(obstacle){
    ctx.fillStyle="rgba(255,0,0,0.3)";
    ctx.fillRect(x+80, y-30, 30, 60);
  }

  // Mini-worlds animations
  if(mini_world.includes("agua")){
    ctx.fillStyle="rgba(0,100,255,0.3)";
    ctx.beginPath();
    ctx.arc(x+50, y+50, 30, 0, Math.PI*2);
    ctx.fill();
  }
  if(mini_world.includes("sol")){
    ctx.fillStyle="yellow";
    ctx.beginPath();
    ctx.arc(x+80, y-50, 25, 0, Math.PI*2);
    ctx.fill();
  }

  // Show mini-game
  if(mini_game) showMiniGame(mini_game);
}
