// ================== CONFIGURACIÓN CANVAS ==================
const canvas = document.getElementById("ai-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let elements = []; // figuras, sol, luna, estrellas
let lastUpdate = Date.now();

// ================== UTILIDADES ==================
function rand(min,max){ return Math.random()*(max-min)+min; }
function degToRad(deg){ return deg*Math.PI/180; }

// ================== ELEMENTOS ==================
function initElements() {
    elements = [];

    // Sol o luna según hora
    const hour = new Date().getHours();
    const isDay = hour >=6 && hour<18;
    elements.push({
        type: isDay?"sun":"moon",
        x: rand(50, canvas.width-50),
        y: rand(50, canvas.height/2),
        radius: 50,
        hue: isDay?60:220
    });

    // Estrellas
    for(let i=0;i<50;i++){
        elements.push({
            type:"star",
            x: rand(0,canvas.width),
            y: rand(0,canvas.height/2),
            size: rand(1,3),
            blink: Math.random()
        });
    }

    // Figuras geométricas 3D/4D
    for(let i=0;i<20;i++){
        elements.push({
            type:"shape",
            x: rand(0,canvas.width),
            y: rand(canvas.height/2, canvas.height),
            size: rand(20,50),
            hue: rand(0,360),
            angle: rand(0,360),
            speed: rand(0.1,0.5)
        });
    }
}

// ================== ACTUALIZACIÓN CANVAS ==================
function updateCanvas(itemText) {
    const now = Date.now();
    const dt = (now - lastUpdate)/1000;
    lastUpdate = now;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    elements.forEach(e=>{
        if(e.type==="sun"||e.type==="moon"){
            ctx.beginPath();
            ctx.arc(e.x,e.y,e.radius,0,2*Math.PI);
            ctx.fillStyle = `hsl(${e.hue},80%,50%)`;
            ctx.fill();
        }
        if(e.type==="star"){
            ctx.beginPath();
            ctx.arc(e.x,e.y,e.size,0,2*Math.PI);
            const alpha = 0.5 + 0.5*Math.sin(Date.now()/500 + e.blink*10);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fill();
        }
        if(e.type==="shape"){
            e.angle += e.speed;
            ctx.save();
            ctx.translate(e.x,e.y);
            ctx.rotate(degToRad(e.angle));
            ctx.fillStyle = `hsl(${e.hue},80%,50%)`;
            ctx.fillRect(-e.size/2,-e.size/2,e.size,e.size);
            ctx.restore();
        }
    });

    // Texto flotante en Canvas
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(itemText, canvas.width/2, canvas.height-50);
}

// ================== LOOP ANIMACIÓN ==================
function loop(){
    updateCanvas();
    requestAnimationFrame(loop);
}

// ================== INICIALIZACIÓN ==================
window.addEventListener("load", ()=>{
    initElements();
    loop();
    window.updateCanvas = updateCanvas;
});
