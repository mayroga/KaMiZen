let missions = [];
let missionIndex = 0;
let blockIndex = 0;

let life = {
    mental: 100,
    focus: 100,
    social: 50,
    money: 1000,
    stress: 0
};

let mode = "narrative"; 
let entities = [];
let frame = 0;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.style.position = "fixed";
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.zIndex = 0;

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ==========================
// LOAD DATA
// ==========================
async function load() {
    const res = await fetch("/session_content");
    const data = await res.json();
    missions = data.missions;
    startMission();
}

// ==========================
// SYSTEM RENDER TEXT + VOICE
// ==========================
function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1;
    msg.pitch = 0.8;
    window.speechSynthesis.speak(msg);
}

// ==========================
// APPLY CONSEQUENCES
// ==========================
function applyImpact(type){
    switch(type){
        case "critica":
            life.stress += 10;
            life.mental -= 5;
            break;
        case "perdida":
            life.money -= 100;
            life.focus -= 10;
            break;
        case "rechazo":
            life.social -= 10;
            life.mental -= 8;
            break;
        case "conflicto":
            life.stress += 20;
            life.social -= 15;
            break;
    }
}

// ==========================
// LIFE SIM EVENTS (JET STYLE)
// ==========================
class EventBox {
    constructor(){
        this.x = canvas.width + 50;
        this.y = Math.random() * canvas.height;
        this.size = 40;
        this.speed = 3 + (life.stress / 20);

        const types = ["critica","perdida","rechazo","conflicto"];
        this.type = types[Math.floor(Math.random()*types.length)];
    }

    update(){
        this.x -= this.speed;
        return this.x > -50;
    }

    draw(){
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// ==========================
// PLAYER (REFLEJO + DECISION)
// ==========================
let player = {
    x: 80,
    y: 200,
    targetY: 200
};

window.addEventListener("mousemove", e => player.targetY = e.clientY);

// ==========================
// MISSION ENGINE
// ==========================
function startMission(){
    missionIndex = 0;
    blockIndex = 0;
    renderBlock();
}

function renderBlock(){
    const mission = missions[missionIndex];
    if(!mission) return;

    const block = mission.blocks[blockIndex];

    let text = block.text?.en || block.question?.en || "";

    speak(text);

    // detect gameplay type
    if(block.type === "strategy"){
        mode = "decision";
    } else if(block.type === "quiz"){
        mode = "decision";
    } else {
        mode = "narrative";
    }

    console.log("BLOCK:", block.type, text);
}

// ==========================
// DECISION SYSTEM (SOCIAL + PSYCHOLOGY)
// ==========================
function decision(result){
    if(result === "avoid"){
        applyImpact("rechazo");
    }
    if(result === "face"){
        life.focus += 5;
        life.mental += 3;
    }
    if(result === "ignore"){
        applyImpact("critica");
    }

    next();
}

// ==========================
// NEXT STEP
// ==========================
function next(){
    blockIndex++;

    if(blockIndex >= missions[missionIndex].blocks.length){
        missionIndex++;
        blockIndex = 0;
    }

    if(missionIndex >= missions.length){
        missionIndex = 0;
    }

    renderBlock();
}

// ==========================
// GAME LOOP (JET + LIFE MIX)
// ==========================
function loop(){
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // player
    player.y += (player.targetY - player.y) * 0.1;

    ctx.fillStyle = "#00f2ff";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, Math.PI*2);
    ctx.fill();

    // spawn life events
    if(frame % Math.max(20, 100 - life.stress) === 0){
        entities.push(new EventBox());
    }

    entities = entities.filter(e => {
        e.update();
        e.draw();

        // collision
        if(Math.abs(e.x - player.x) < 30 && Math.abs(e.y - player.y) < 30){
            applyImpact(e.type);
            return false;
        }

        return e.x > -100;
    });

    frame++;
    requestAnimationFrame(loop);
}

load();
loop();
