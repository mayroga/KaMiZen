const canvas = document.getElementById("lifeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let obstacles = [];
let miniWorld = "luz";

function randomObstacle(x){
    const type = Math.random() > 0.5 ? "circle" : "rect";
    const y = Math.random() * canvas.height * 0.6 + canvas.height * 0.2;
    return {x, y, type, size: 20 + Math.random()*20};
}

function drawMiniWorld(world){
    switch(world){
        case "agua":
            ctx.fillStyle="rgba(0,0,200,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "luz":
            ctx.fillStyle="rgba(255,255,200,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "sol":
            ctx.fillStyle="rgba(255,200,0,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "noche":
            ctx.fillStyle="rgba(10,10,40,1)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "nubes":
            ctx.fillStyle="rgba(200,200,255,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "montañas":
            ctx.fillStyle="rgba(50,100,50,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "bosque":
            ctx.fillStyle="rgba(0,100,0,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "ciudad":
            ctx.fillStyle="rgba(100,100,100,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "playa":
            ctx.fillStyle="rgba(255,230,180,0.3)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        case "estrellas":
            ctx.fillStyle="rgba(255,255,255,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
        default:
            ctx.fillStyle="rgba(50,50,80,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height); break;
    }
}

window.updateLifeCanvas = function(pos, world){
    miniWorld = world;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawMiniWorld(miniWorld);

    // Camino
    ctx.strokeStyle="#888"; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(50,canvas.height/2); ctx.lineTo(pos,canvas.height/2); ctx.stroke();

    // Usuario
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(pos,canvas.height/2,12,0,Math.PI*2); ctx.fill();

    // Obstáculos
    if(obstacles.length<5) obstacles.push(randomObstacle(pos+100));
    obstacles.forEach(o=>{
        ctx.fillStyle=o.type==="circle"?"rgba(0,200,200,0.3)":"rgba(200,0,0,0.3)";
        if(o.type==="circle"){ ctx.beginPath(); ctx.arc(o.x,o.y,o.size,0,Math.PI*2); ctx.fill(); }
        else{ ctx.fillRect(o.x,o.y-o.size/2,o.size,o.size); }
        o.x-=2;
    });
    obstacles = obstacles.filter(o=>o.x+o.size>0);
};
