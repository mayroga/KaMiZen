const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let x = 60;
let y = canvas.height/2;

function moveMap(step, mini_world, obstacle, choice, mini_game){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="#111";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle="#fff";
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(40,y);
  ctx.quadraticCurveTo(x+step,y-40,x+step,y);
  ctx.stroke();

  x+=step;

  ctx.fillStyle="#00ccff";
  ctx.beginPath();
  ctx.arc(x,y,12,0,Math.PI*2);
  ctx.fill();

  if(obstacle){
    ctx.fillStyle="rgba(255,0,0,0.3)";
    ctx.fillRect(x+60,y-30,30,60);
  }

  if(mini_world.includes("agua")){
    ctx.fillStyle="rgba(0,120,255,0.3)";
    ctx.beginPath();
    ctx.arc(x+50,y+50,30,0,Math.PI*2);
    ctx.fill();
  }

  if(mini_world.includes("sol")){
    ctx.fillStyle="rgba(255,215,0,0.6)";
    ctx.beginPath();
    ctx.arc(x+80,y-50,25,0,Math.PI*2);
    ctx.fill();
  }

  if(mini_world.includes("ciudad")){
    ctx.fillStyle="gray";
    ctx.fillRect(x+30,y-40,50,40);
  }

  if(mini_game) showMiniGame(mini_game);
}
