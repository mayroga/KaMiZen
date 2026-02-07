const canvasLevel2 = document.getElementById("lifeCanvas");
const ctxLevel2 = canvasLevel2.getContext("2d");

canvasLevel2.width = window.innerWidth * 0.95;
canvasLevel2.height = window.innerHeight * 0.85;

let nodesLevel2 = [];
let obstaclesLevel2 = [];
let pathLevel2 = [];
let avatarLevel2 = {x: 50, y: canvasLevel2.height - 50, size: 22, color: "green"};

function generateLifeMapLevel2() {
    nodesLevel2 = [];
    obstaclesLevel2 = [];
    pathLevel2 = [];
    
    for(let i=0;i<12;i++){
        nodesLevel2.push({
            x: 100 + i*120,
            y: 150 + Math.random()*(canvasLevel2.height-300),
            r: 22,
            type: ['wealth','knowledge','wellbeing'][Math.floor(Math.random()*3)]
        });
        obstaclesLevel2.push({
            x: 100 + i*120 + 50,
            y: 150 + Math.random()*(canvasLevel2.height-300),
            r: 18,
            type: ['fear','doubt','hate','anger','procrastination'][Math.floor(Math.random()*5)]
        });
        pathLevel2.push({x: nodesLevel2[i].x, y: nodesLevel2[i].y});
    }
}

function drawMapLevel2() {
    ctxLevel2.clearRect(0,0,canvasLevel2.width,canvasLevel2.height);

    // Línea del camino
    ctxLevel2.beginPath();
    ctxLevel2.moveTo(avatarLevel2.x, avatarLevel2.y);
    pathLevel2.forEach(p => ctxLevel2.lineTo(p.x, p.y));
    ctxLevel2.strokeStyle = "#1E90FF";
    ctxLevel2.lineWidth = 4;
    ctxLevel2.stroke();

    // Nodos
    nodesLevel2.forEach(n => {
        ctxLevel2.beginPath();
        ctxLevel2.arc(n.x, n.y, n.r, 0, 2*Math.PI);
        if(n.type==='wealth') ctxLevel2.fillStyle='gold';
        else if(n.type==='knowledge') ctxLevel2.fillStyle='violet';
        else ctxLevel2.fillStyle='lightgreen';
        ctxLevel2.fill();
        ctxLevel2.strokeStyle='white';
        ctxLevel2.stroke();
    });

    // Obstáculos
    obstaclesLevel2.forEach(o => {
        ctxLevel2.beginPath();
        ctxLevel2.arc(o.x, o.y, o.r, 0, 2*Math.PI);
        ctxLevel2.fillStyle='red';
        ctxLevel2.fill();
    });

    // Avatar
    ctxLevel2.beginPath();
    ctxLevel2.arc(avatarLevel2.x, avatarLevel2.y, avatarLevel2.size, 0, 2*Math.PI);
    ctxLevel2.fillStyle = avatarLevel2.color;
    ctxLevel2.fill();

    requestAnimationFrame(drawMapLevel2);
}

let currentTargetLevel2 = 0;
function moveAvatarLevel2(){
    if(currentTargetLevel2 < pathLevel2.length){
        let target = pathLevel2[currentTargetLevel2];
        let dx = target.x - avatarLevel2.x;
        let dy = target.y - avatarLevel2.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 2){ currentTargetLevel2++; } 
        else { avatarLevel2.x += dx*0.4; avatarLevel2.y += dy*0.4; }
        requestAnimationFrame(moveAvatarLevel2);
    }
}

generateLifeMapLevel2();
drawMapLevel2();
