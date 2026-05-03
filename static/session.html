<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>AL CIELO | NEURO-SURVIVAL</title>
    <style>
        :root {
            --neon-blue: #00f2ff;
            --neon-gold: #f1c40f;
            --neon-green: #2ecc71;
            --neon-red: #ff3131;
            --bg-dark: #020205;
        }
        body { margin: 0; overflow: hidden; background: var(--bg-dark); color: white; font-family: 'Orbitron', sans-serif; cursor: none; }
        
        #hud {
            position: absolute; top: 20px; width: 100%;
            display: flex; justify-content: space-evenly;
            z-index: 100; pointer-events: none;
        }
        .data-box {
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid var(--neon-blue);
            padding: 10px 20px; text-align: center;
            box-shadow: 0 0 20px rgba(0, 242, 255, 0.2);
            min-width: 130px;
        }
        .label { font-size: 10px; color: var(--neon-blue); letter-spacing: 2px; font-weight: 900; display: block; }
        .value { font-size: 24px; font-weight: 900; display: block; }

        canvas { display: block; }

        #overlay {
            position: fixed; inset: 0; background: var(--bg-dark);
            display: flex; flex-direction: column; justify-content: center;
            align-items: center; z-index: 1000; text-align: center;
        }
        .start-btn {
            padding: 20px 50px; background: var(--neon-blue); color: black;
            border: none; font-family: 'Orbitron'; font-weight: 900;
            cursor: pointer; margin-top: 30px; letter-spacing: 3px;
            box-shadow: 0 0 30px var(--neon-blue);
        }
        #alert-flash {
            position: fixed; inset: 0; pointer-events: none;
            z-index: 50; opacity: 0; transition: opacity 0.1s;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap" rel="stylesheet">
</head>
<body>

<div id="alert-flash"></div>

<div id="hud">
    <div class="data-box" style="border-color: var(--neon-gold);">
        <span class="label">CAPITAL ACTUAL</span>
        <span id="val-money" class="value">0</span>
    </div>
    <div class="data-box" style="border-color: var(--neon-green);">
        <span class="label">ESTABILIDAD</span>
        <span id="val-health" class="value">100%</span>
    </div>
    <div class="data-box" style="border-color: var(--neon-blue);">
        <span class="label">RANGO NEURAL</span>
        <span id="val-rank" class="value">NOVATO</span>
    </div>
</div>

<div id="overlay">
    <h1 style="color: var(--neon-blue); letter-spacing: 15px; font-size: 40px;">AL CIELO</h1>
    <h2 style="color: var(--neon-gold); font-size: 14px;">SIMULADOR DE SUPERVIVENCIA Y DISCIPLINA</h2>
    <p style="color: #666; max-width: 400px; font-size: 12px; margin-top: 20px;">
        ADVERTENCIA: Las amenazas reducen tu capital al 50%. <br>La estabilidad en 0% reinicia el sistema.
    </p>
    <button class="start-btn" onclick="startGame()">INICIAR INTERFAZ</button>
</div>

<canvas id="gameCanvas"></canvas>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let audioCtx;

// --- CONFIGURACIÓN DE ESCENARIOS (LO QUE NO ENSEÑAN) ---
const rawData = [
    { text: "MIRAR LADOS", type: "pos", impact: 200, color: "#2ecc71", freq: 880 },
    { text: "DESCONOCIDO", type: "neg", impact: -40, color: "#ff3131", freq: 110 },
    { text: "AHORRO", type: "pos", impact: 150, color: "#f1c40f", freq: 659 },
    { text: "BULLYING", type: "neg", impact: -30, color: "#ff3131", freq: 90 },
    { text: "DISCIPLINA", type: "pos", impact: 300, color: "#00f2ff", freq: 1046 },
    { text: "DISTRACCIÓN", type: "neg", impact: -25, color: "#e67e22", freq: 130 },
    { text: "SALIDA EMERG.", type: "pos", impact: 400, color: "#2ecc71", freq: 1200 }
];

let stats = { money: 0, health: 100, rank: "NOVATO" };
let active = false;
let objects = [];
let particles = [];
let difficulty = 1.0;
const user = { x: canvas.width / 2, y: canvas.height / 2, size: 55 };

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- SISTEMA DE SONIDO AGRESIVO (CASTIGO/RECOMPENSA) ---
function triggerSound(freq, type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Onda de sierra para peligros (agresivo), Senoidal para éxitos (placentero)
    osc.type = type === 'pos' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

function flashScreen(color) {
    const f = document.getElementById('alert-flash');
    f.style.backgroundColor = color;
    f.style.opacity = "0.4";
    setTimeout(() => f.style.opacity = "0", 150);
}

function spawn() {
    if(!active) return;
    const entry = rawData[Math.floor(Math.random() * rawData.length)];
    objects.push({
        ...entry,
        x: Math.random() * (canvas.width - 200) + 100,
        y: -150,
        speed: (2.5 + (stats.money / 10000)) * difficulty
    });
}

function update() {
    if(!active) return;

    objects.forEach((obj, i) => {
        obj.y += obj.speed;

        const dist = Math.sqrt((obj.x - user.x)**2 + (obj.y - user.y)**2);
        if (dist < user.size) {
            if (obj.type === 'neg') {
                // PENALIZACIÓN CRÍTICA
                stats.health = Math.max(0, stats.health + obj.impact);
                stats.money = Math.floor(stats.money * 0.5); // PIERDE LA MITAD
                triggerSound(obj.freq, 'neg');
                flashScreen('red');
                if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
            } else {
                // RECOMPENSA
                stats.money += obj.impact;
                stats.health = Math.min(100, stats.health + 5);
                triggerSound(obj.freq, 'pos');
                flashScreen('gold');
                difficulty += 0.02; // ESCALABILIDAD
            }
            
            updateHUD();
            createExplosion(obj.x, obj.y, obj.color);
            objects.splice(i, 1);
        }
        if(obj.y > canvas.height + 200) objects.splice(i, 1);
    });

    if(stats.health <= 0) endGame("SISTEMA COLAPSADO: FALTA DE ALERTA.");
}

function updateHUD() {
    document.getElementById('val-money').innerText = stats.money;
    document.getElementById('val-health').innerText = stats.health + "%";
    
    if(stats.money > 5000) stats.rank = "GUARDIÁN";
    if(stats.money > 15000) stats.rank = "MAESTRO";
    document.getElementById('val-rank').innerText = stats.rank;
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 1.0, color
        });
    }
}

function draw() {
    ctx.fillStyle = 'rgba(2, 2, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DIBUJAR SCANNER (USER)
    ctx.shadowBlur = 20;
    ctx.shadowColor = varColor('--neon-blue');
    ctx.strokeStyle = varColor('--neon-blue');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(user.x, user.y, user.size - 10, 0, Math.PI * 2);
    ctx.stroke();

    // DIBUJAR AMENAZAS / OPORTUNIDADES
    objects.forEach(obj => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obj.color;
        ctx.fillStyle = "white";
        ctx.font = "900 18px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(obj.text, obj.x, obj.y);
        
        // EFECTO DE LÍNEA DE AMENAZA
        if(obj.type === 'neg') {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(obj.x, obj.y); ctx.lineTo(user.x, user.y);
            ctx.stroke();
        }
    });

    particles.forEach((p, i) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if(p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;
}

function varColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

window.addEventListener('mousemove', e => { user.x = e.clientX; user.y = e.clientY; });
window.addEventListener('touchmove', e => { user.x = e.touches[0].clientX; user.y = e.touches[0].clientY; e.preventDefault(); }, {passive: false});

function startGame() {
    document.getElementById('overlay').style.display = 'none';
    active = true;
    setInterval(spawn, 800);
    loop();
}

function endGame(msg) {
    active = false;
    alert(msg);
    location.reload();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
</script>
</body>
</html>
