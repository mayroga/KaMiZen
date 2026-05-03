<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>AL CIELO - NEURAL SURVIVAL</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --neon-blue: #00f2ff; --neon-gold: #f1c40f; --neon-green: #2ecc71;
            --neon-red: #ff3131; --bg-dark: #020205;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; overflow: hidden; background: var(--bg-dark); color: white; font-family: 'Orbitron', sans-serif; touch-action: none; }
        
        #hud {
            position: absolute; top: env(safe-area-inset-top, 20px); width: 100%;
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
            padding: 0 15px; z-index: 100; pointer-events: none;
        }
        .data-box {
            background: rgba(0, 0, 0, 0.8); border: 2px solid var(--neon-blue);
            padding: 8px; text-align: center; border-radius: 12px;
            backdrop-filter: blur(10px); box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
        }
        .label { font-size: 8px; color: var(--neon-blue); letter-spacing: 1px; font-weight: 900; display: block; text-transform: uppercase; }
        .value { font-size: 18px; font-weight: 900; display: block; color: #fff; }

        #start-screen {
            position: fixed; inset: 0; background: radial-gradient(circle, #0a0a1a 0%, #020205 100%);
            display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000;
        }
        .start-btn {
            padding: 20px 60px; background: var(--neon-blue); color: #000;
            border: none; font-family: 'Orbitron'; font-weight: 900; font-size: 1.2rem;
            cursor: pointer; margin-top: 40px; letter-spacing: 4px; border-radius: 50px;
            box-shadow: 0 0 40px var(--neon-blue); transition: 0.3s;
        }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
</head>
<body>

<div id="hud">
    <div class="data-box" style="border-color: var(--neon-gold);"><span class="label">CAPITAL</span><span id="val-money" class="value">$0</span></div>
    <div class="data-box" style="border-color: var(--neon-green);"><span class="label">STABILITY</span><span id="val-health" class="value">100%</span></div>
    <div class="data-box" style="border-color: #fff;"><span class="label">LOCATION</span><span id="val-loc" class="value">HOME</span></div>
</div>

<div id="start-screen">
    <h1 style="color: var(--neon-blue); letter-spacing: 12px; font-size: clamp(30px, 10vw, 60px); margin: 0;">AL CIELO</h1>
    <p style="letter-spacing: 4px; color: var(--neon-gold); font-size: 10px;">USA SURVIVAL & NEURAL DISCIPLINE</p>
    <button class="start-btn" onclick="startGame()">START LIFE</button>
</div>

<canvas id="gameCanvas"></canvas>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let audioCtx, mainGain, bgOsc;

// --- CONFIGURACIÓN DE ALTA DEFINICIÓN (Retina/Mobile fix) ---
function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', setupCanvas);
setupCanvas();

const locations = [
    { name: "HOME", color: "#050510", accent: "#2ecc71" },
    { name: "SCHOOL", color: "#0a0510", accent: "#f1c40f" },
    { name: "USA STREET", color: "#051010", accent: "#3498db" },
    { name: "FUTURE", color: "#100510", accent: "#9b59b6" }
];

const rawData = [
    { text: "SAVINGS", type: "pos", impact: 200, color: "#f1c40f", freq: 523 },
    { text: "FAMILY TIME", type: "pos", impact: 15, color: "#2ecc71", freq: 659 },
    { text: "USA LAW", type: "pos", impact: 100, color: "#3498db", freq: 783 },
    { text: "DANGER", type: "neg", impact: -30, color: "#ff3131", freq: 110 },
    { text: "BAD DEBT", type: "neg", impact: -20, color: "#e67e22", freq: 90 },
    { text: "EDUCATION", type: "pos", impact: 300, color: "#00f2ff", freq: 987 }
];

let stats = { money: 0, health: 100, locIndex: 0 };
let active = false;
let objects = [];
let particles = [];
const user = { x: window.innerWidth / 2, y: window.innerHeight * 0.8, size: 45 };

// --- MOTOR DE AUDIO DINÁMICO ---
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    mainGain = audioCtx.createGain();
    mainGain.connect(audioCtx.destination);
    
    // Música de fondo latente (estilo Neural)
    bgOsc = audioCtx.createOscillator();
    bgOsc.type = 'triangle';
    bgOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
    const bgGain = audioCtx.createGain();
    bgGain.gain.value = 0.05;
    bgOsc.connect(bgGain);
    bgGain.connect(mainGain);
    bgOsc.start();
}

function playEffect(freq, type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type === 'pos' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + 0.4);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    osc.connect(g);
    g.connect(mainGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

function spawn() {
    if(!active) return;
    const entry = rawData[Math.floor(Math.random() * rawData.length)];
    objects.push({
        ...entry,
        x: Math.random() * (window.innerWidth - 100) + 50,
        y: -50,
        speed: 3 + (stats.money / 10000),
        rot: Math.random() * Math.PI
    });
    
    // Cambio de locación basado en progreso
    if(stats.money > 0 && stats.money % 2000 === 0) {
        stats.locIndex = (stats.locIndex + 1) % locations.length;
        document.getElementById('val-loc').innerText = locations[stats.locIndex].name;
    }
}

function update() {
    if(!active) return;

    objects.forEach((obj, i) => {
        obj.y += obj.speed;
        obj.rot += 0.02;

        const dist = Math.sqrt((obj.x - user.x)**2 + (obj.y - user.y)**2);
        if (dist < user.size) {
            playEffect(obj.freq, obj.type);
            createExplosion(obj.x, obj.y, obj.color);
            
            if(obj.type === 'neg') {
                stats.health = Math.max(0, stats.health + obj.impact);
                stats.money = Math.floor(stats.money * 0.5); // Castigo USA: pierdes capital
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            } else {
                stats.money += obj.impact;
                stats.health = Math.min(100, stats.health + 2);
                if (window.navigator.vibrate) window.navigator.vibrate(20);
            }
            
            updateHUD();
            objects.splice(i, 1);
        }
        if(obj.y > window.innerHeight + 100) objects.splice(i, 1);
    });

    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if(p.life <= 0) particles.splice(i, 1);
    });

    if(stats.health <= 0) endGame();
}

function updateHUD() {
    document.getElementById('val-money').innerText = "$" + stats.money;
    document.getElementById('val-health').innerText = stats.health + "%";
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1.0, color
        });
    }
}

function draw() {
    // Fondo dinámico según locación
    const loc = locations[stats.locIndex];
    ctx.fillStyle = loc.color;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Grid de fondo (Efecto profundidad)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for(let i=0; i<window.innerWidth; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, window.innerHeight); ctx.stroke();
    }

    // Avatar del Usuario (Círculo de Enfoque)
    ctx.shadowBlur = 20;
    ctx.shadowColor = loc.accent;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(user.x, user.y, user.size - 5, 0, Math.PI * 2);
    ctx.stroke();

    // Objetos (Texto nítido)
    objects.forEach(obj => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obj.color;
        ctx.fillStyle = obj.color;
        ctx.font = "900 16px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(obj.text, obj.x, obj.y);
        
        // Línea de amenaza táctica
        if(obj.type === 'neg') {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "rgba(255, 49, 49, 0.3)";
            ctx.beginPath(); ctx.moveTo(obj.x, obj.y); ctx.lineTo(user.x, user.y); ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;
}

function handleInput(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    user.x = x; user.y = y;
}
window.addEventListener('mousemove', handleInput);
window.addEventListener('touchmove', handleInput, {passive: false});

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    initAudio();
    active = true;
    setInterval(spawn, 700);
    loop();
}

function endGame() {
    active = false;
    alert("LIFE RECAP\nFinal Capital: $" + stats.money + "\nStability: 0%\nTry again with more discipline.");
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
