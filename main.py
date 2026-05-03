<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>AL CIELO | TOTAL SURVIVAL</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --neon-blue: #00f2ff; --neon-gold: #f1c40f; --neon-red: #ff3131;
            --bg-dark: #020205; --safe-green: #2ecc71;
        }
        body, html { 
            margin: 0; padding: 0; overflow: hidden; 
            background: var(--bg-dark); color: white;
            font-family: 'Orbitron', sans-serif; height: 100%;
        }
        
        /* HUD - High Resolution Text */
        #hud {
            position: absolute; top: env(safe-area-inset-top, 20px); width: 100%;
            display: flex; justify-content: space-evenly; z-index: 100; pointer-events: none;
        }
        .data-box {
            background: rgba(0, 0, 0, 0.9); border: 1.5px solid var(--neon-blue);
            padding: 8px 12px; text-align: center; min-width: 100px;
            border-radius: 4px; backdrop-filter: blur(10px);
        }
        .label { font-size: 8px; color: var(--neon-blue); letter-spacing: 1px; font-weight: 900; display: block; }
        .value { font-size: 18px; font-weight: 900; display: block; text-shadow: 0 0 10px var(--neon-blue); }

        #start-screen {
            position: fixed; inset: 0; background: radial-gradient(circle, #111 0%, #000 100%);
            display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000;
        }
        .start-btn {
            padding: 20px 40px; background: var(--neon-blue); color: #000;
            border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer;
            letter-spacing: 4px; box-shadow: 0 0 40px var(--neon-blue); border-radius: 50px;
        }

        #environment-tag {
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
            font-size: 12px; letter-spacing: 5px; color: rgba(255,255,255,0.5); z-index: 50;
        }

        canvas { display: block; touch-action: none; }
    </style>
</head>
<body>

<div id="hud">
    <div class="data-box" style="border-color: var(--neon-gold);"><span class="label">NET WORTH</span><span id="val-money" class="value">$0</span></div>
    <div class="data-box" style="border-color: var(--neon-red);"><span class="label">STABILITY</span><span id="val-health" class="value">100%</span></div>
    <div class="data-box" style="border-color: var(--safe-green);"><span class="label">RANK</span><span id="val-rank" class="value">ROOKIE</span></div>
</div>

<div id="environment-tag">LOCATION: <span id="loc-name">STREETS</span></div>

<div id="start-screen">
    <h1 style="font-size: 45px; letter-spacing: 10px; margin-bottom: 0;">AL CIELO</h1>
    <p style="color: var(--neon-gold); font-size: 10px; letter-spacing: 2px;">USA SURVIVAL MATRIX • 50 STATES</p>
    <button class="start-btn" onclick="startGame()">START LIFE</button>
</div>

<canvas id="gameCanvas"></canvas>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let audioCtx;
let dpr = window.devicePixelRatio || 1;

// --- LIFE SCENARIOS (USA REALITY) ---
const scenarios = {
    STREETS: { color: "#050508", items: ["EXIT SIGNS", "SITUATIONAL AWARENESS", "STRANGER DANGER", "PEER PRESSURE"] },
    SCHOOL: { color: "#0a0a1a", items: ["DISCIPLINA", "EDUCATION", "BULLYING", "FOCUS"] },
    BANK: { color: "#0a1a0a", items: ["SAVINGS", "INVESTMENT", "CREDIT SCORE", "DEBT TRAP"] },
    HOME: { color: "#1a0a00", items: ["FAMILY", "RESPECT", "GUN SAFETY", "VALUES"] }
};

const rawData = [
    { text: "SAVINGS", type: "pos", impact: 500, color: "#f1c40f", scale: 1 },
    { text: "EXIT SIGNS", type: "pos", impact: 1000, color: "#2ecc71", scale: 1.2 },
    { text: "STRANGER", type: "neg", impact: -80, color: "#ff3131", scale: 1.5 },
    { text: "PEER PRESSURE", type: "neg", impact: -40, color: "#e67e22", scale: 1 },
    { text: "EDUCATION", type: "pos", impact: 300, color: "#00f2ff", scale: 1 },
    { text: "GUN SAFETY", type: "pos", impact: 2000, color: "#9b59b6", scale: 1.1 },
    { text: "CREDIT DEBT", type: "neg", impact: -50, color: "#ff3131", scale: 1 }
];

let stats = { money: 0, health: 100, rank: "ROOKIE" };
let currentLoc = "STREETS";
let active = false;
let objects = [];
let particles = [];
let pulse = 0;
const user = { x: 0, y: 0, size: 45 * dpr };

function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    user.x = window.innerWidth / 2;
    user.y = window.innerHeight * 0.8;
}
window.addEventListener('resize', resize);
resize();

// --- NEURAL AUDIO SYSTEM ---
function playNeuralSound(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'pos') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    osc.stop(audioCtx.currentTime + 0.5);
}

function spawn() {
    if(!active) return;
    const entry = rawData[Math.floor(Math.random() * rawData.length)];
    objects.push({
        ...entry,
        x: Math.random() * (window.innerWidth - 100) + 50,
        y: -50,
        speed: 3 + (stats.money / 10000)
    });
    
    // Change location periodically
    if (Math.random() < 0.05) {
        const locKeys = Object.keys(scenarios);
        currentLoc = locKeys[Math.floor(Math.random() * locKeys.length)];
        document.getElementById('loc-name').innerText = currentLoc;
    }
}

function update() {
    if(!active) return;
    pulse += 0.05;

    objects.forEach((obj, i) => {
        obj.y += obj.speed;
        const dx = obj.x - user.x;
        const dy = obj.y - user.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < user.size) {
            playNeuralSound(obj.type);
            if (obj.type === 'neg') {
                stats.health -= 30;
                stats.money = Math.floor(stats.money * 0.2); // CAPITAL CRASH
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            } else {
                stats.money += obj.impact;
                stats.health = Math.min(100, stats.health + 5);
                if (window.navigator.vibrate) window.navigator.vibrate(20);
            }
            createParticles(obj.x, obj.y, obj.color);
            updateHUD();
            objects.splice(i, 1);
        }
        if(obj.y > window.innerHeight + 50) objects.splice(i, 1);
    });

    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if(p.life <= 0) particles.splice(i, 1);
    });

    if(stats.health <= 0) {
        active = false;
        alert("CRITICAL SYSTEM FAILURE. YOUR WEALTH WAS $" + stats.money);
        location.reload();
    }
}

function updateHUD() {
    document.getElementById('val-money').innerText = "$" + stats.money;
    document.getElementById('val-health').innerText = stats.health + "%";
    if (stats.money > 10000) stats.rank = "GUARDIAN";
    if (stats.money > 50000) stats.rank = "CITIZEN X";
    document.getElementById('val-rank').innerText = stats.rank;
}

function createParticles(x, y, color) {
    for(let i=0; i<10; i++) {
        particles.push({x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1, color});
    }
}

function draw() {
    // Dynamic Background Transition
    ctx.fillStyle = scenarios[currentLoc].color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalAlpha = 1;

    // High Quality User Avatar (Neon Core)
    const orbit = Math.sin(pulse) * 5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f2ff";
    ctx.strokeStyle = "#00f2ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(user.x, user.y, user.size/2 + orbit, 0, Math.PI*2);
    ctx.stroke();

    // High Contrast Objects
    objects.forEach(obj => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obj.color;
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${14 * obj.scale}px Orbitron`;
        ctx.textAlign = "center";
        ctx.fillText(obj.text, obj.x, obj.y);
    });

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
}

const input = (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    user.x = t.clientX - rect.left;
    user.y = t.clientY - rect.top;
};
window.addEventListener('mousemove', input);
window.addEventListener('touchmove', (e) => { input(e); e.preventDefault(); }, {passive: false});

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    active = true;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setInterval(spawn, 800);
    loop();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
</script>
</body>
</html>
