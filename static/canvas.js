const canvas = document.getElementById("lifeCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.8;

let nodes = [];
let obstacles = [];
let path = [];
let avatar = {x: 50, y: canvas.height - 50, size: 20};

function generateLifeMap() {
  nodes = [];
  obstacles = [];
  for(let i=0;i<10;i++){
    nodes.push({x: 100 + i*150, y: 100 + Math.random()*(canvas.height-200), r: 20});
    obstacles.push({x: 100 + i*150 + 50, y: 100 + Math.random()*(canvas.height-200), r: 15, type: 'miedo'});
  }
  path = nodes.map(n => ({x:n.x, y:n.y}));
}

function drawMap() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  // Draw path lines
  ctx.beginPath();
  ctx.moveTo(avatar.x, avatar.y);
  path.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = "#00f";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw nodes (wealth)
  nodes.forEach(n=>{
    ctx.beginPath();
    ctx.arc(n.x,n.y,n.r,0,2*Math.PI);
    ctx.fillStyle="gold";
    ctx.fill();
    ctx.strokeStyle="orange";
    ctx.stroke();
  });

  // Draw obstacles
  obstacles.forEach(o=>{
    ctx.beginPath();
    ctx.arc(o.x,o.y,o.r,0,2*Math.PI);
    ctx.fillStyle="red";
    ctx.fill();
  });

  // Draw avatar
  ctx.beginPath();
  ctx.arc(avatar.x,avatar.y,avatar.size,0,2*Math.PI);
  ctx.fillStyle="green";
  ctx.fill();

  requestAnimationFrame(drawMap);
}

generateLifeMap();
drawMap();

// Move avatar along path
let currentTarget = 0;
function moveAvatar(){
  if(currentTarget<path.length){
    let target = path[currentTarget];
    let dx = target.x - avatar.x;
    let dy = target.y - avatar.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if(dist<2){currentTarget++;} 
    else {avatar.x+=dx*0.5; avatar.y+=dy*0.5;}
    requestAnimationFrame(moveAvatar);
  }
}
