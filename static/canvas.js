const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let x = 50;
let y = canvas.height/2;

function moveMap(step, mini_world, obstacle, choice, mini_game){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Fondo elegante negro con líneas y curvas blancas
    ctx.fillStyle="#111111";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Camino de la vida
    ctx.strokeStyle="#ffffff";
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.moveTo(40, canvas.height/2);
    ctx.quadraticCurveTo(x+step, y-50, x+step, y);
    ctx.stroke();
    
    x += step;

    // Marcador del usuario
    ctx.fillStyle="#00ccff";
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI*2);
    ctx.fill();

    // Obstáculos interactivos
    if(obstacle){
        ctx.fillStyle="rgba(255,0,0,0.3)";
        ctx.fillRect(x+80, y-30, 30, 60);
        if(choice){
            showObstacleChoice(obstacle);
        }
    }

    // Mini-mundos
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
    if(mini_world.includes("ciudad")){
        ctx.fillStyle="gray";
        ctx.fillRect(x+30, y-40, 50, 40);
    }

    // Mini-juegos visibles
    if(mini_game) showMiniGame(mini_game);
}

function showObstacleChoice(obstacle){
    const mg = document.getElementById("miniGame");
    mg.innerHTML = `<p>Decide qué hacer con "${obstacle}"</p>
        <button onclick="handleObstacle('${obstacle}', true)">Quitar</button>
        <button onclick="handleObstacle('${obstacle}', false)">Dejar</button>`;
}

function handleObstacle(obstacle, remove){
    const mg = document.getElementById("miniGame");
    mg.innerHTML = remove
        ? `<p>Al quitar "${obstacle}", el camino será más largo, pero llegarás al bienestar.</p>`
        : `<p>Dejar "${obstacle}" mantiene el camino estable hacia el bienestar.</p>`;
}
