let state = {
    lang: 'en',
    paused: false,
    stats: { stability: 50, resources: 20, energy: 70 },
    userName: "USER",
    missionActive: false,
    started: false,
    data: null,
    currentMissionIdx: 0,
    timer: 300
};

const WORDS = {
    pos: ["FOCUS", "SAVING", "CALM", "RESPECT", "SAFETY", "TRUTH", "HELP"],
    neg: ["IMPULSE", "WASTE", "ANGER", "NOISE", "HASTE", "EGO", "LIES"]
};

// Música de enfoque (Binaural)
const AudioEngine = {
    init() {
        this.bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'); 
        this.bgm.loop = true;
        this.bgm.volume = 0.15;
    },
    speak(text) {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.lang === 'es' ? 'es-ES' : 'en-US';
        msg.rate = 0.85; // Voz calmada
        speechSynthesis.speak(msg);
    }
};

function updateUI() {
    // Actualizar barras
    Object.keys(state.stats).forEach(key => {
        document.getElementById(`bar-${key}`).style.width = state.stats[key] + "%";
        document.getElementById(`val-${key}`).innerText = state.stats[key] + "%";
    });

    // Evolución del Avatar
    const scale = 0.6 + (state.stats.stability / 100);
    const container = document.getElementById('avatar-container');
    container.style.transform = `translateX(-50%) scale(${scale})`;
    
    const lines = document.querySelectorAll('.stickman');
    const color = state.stats.stability > 60 ? "#2ecc71" : (state.stats.stability < 30 ? "#e74c3c" : "#00d4ff");
    lines.forEach(l => {
        l.style.stroke = color;
        l.style.strokeWidth = 3 + (state.stats.resources / 20); // Más recursos = más fuerte/robusto
    });
}

function spawnWord() {
    if (state.paused || state.missionActive || !state.started) return;

    const isPos = Math.random() > 0.4;
    const text = isPos ? WORDS.pos[Math.floor(Math.random() * WORDS.pos.length)] : WORDS.neg[Math.floor(Math.random() * WORDS.neg.length)];

    const div = document.createElement('div');
    div.className = 'word-box';
    div.innerText = text;
    div.style.left = Math.random() * 75 + 10 + "vw";
    if (!isPos) div.style.borderColor = "var(--error)";

    div.onclick = () => {
        if (isPos) {
            state.stats.stability = Math.min(100, state.stats.stability + 10);
            state.stats.energy = Math.min(100, state.stats.energy + 5);
        } else {
            state.stats.stability = Math.max(0, state.stats.stability - 10);
            state.stats.energy = Math.max(0, state.stats.energy - 5);
        }
        updateUI();
        div.style.transform = "scale(0)";
        setTimeout(() => div.remove(), 200);
    };

    document.body.appendChild(div);
    setTimeout(() => { if(div.parentNode) div.remove(); }, 9000);
}

async function runMission() {
    state.missionActive = true;
    const overlay = document.getElementById('overlay');
    const grid = document.getElementById('decision-grid');
    const btnCont = document.getElementById('btn-continue');
    
    overlay.style.display = 'flex';
    btnCont.style.display = 'none';
    grid.innerHTML = '';

    const mission = state.data.missions[state.currentMissionIdx];
    const qBlock = mission.b.find(b => b.t === 'd');
    
    document.getElementById('phase-title').innerText = mission.b[0].tx[state.lang];
    document.getElementById('phase-desc').innerText = qBlock.q[state.lang];
    AudioEngine.speak(qBlock.q[state.lang]);

    qBlock.op.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = opt.split(' / ')[state.lang === 'es' ? 1 : 0];
        
        btn.onclick = () => {
            const isCorrect = idx === qBlock.c;
            // Limpiar otros botones
            Array.from(grid.children).forEach(b => b.className = 'choice-btn');
            
            btn.className = isCorrect ? 'choice-btn selected-correct' : 'choice-btn selected-wrong';
            document.getElementById('phase-desc').innerText = qBlock.ex[idx].split(' / ')[state.lang === 'es' ? 1 : 0];
            
            // Impacto en recursos y estabilidad
            if(isCorrect) {
                state.stats.resources = Math.min(100, state.stats.resources + 15);
                state.stats.stability = Math.min(100, state.stats.stability + 10);
            } else {
                state.stats.stability = Math.max(0, state.stats.stability - 15);
            }
            
            updateUI();
            btnCont.style.display = 'block'; // Pausa de poder: el niño decide cuándo seguir
        };
        grid.appendChild(btn);
    });
}

function resolveMission() {
    document.getElementById('overlay').style.display = 'none';
    state.currentMissionIdx = (state.currentMissionIdx + 1) % state.data.missions.length;
    state.missionActive = false;
}

function togglePause() {
    state.paused = !state.paused;
    document.getElementById('pause-overlay').style.display = state.paused ? 'flex' : 'none';
}

function startSystem() {
    const name = document.getElementById('user-name').value || "RECRUIT";
    state.userName = name;
    document.getElementById('avatar-name').innerText = state.userName;
    
    AudioEngine.init();
    AudioEngine.bgm.play();

    fetch('/api/mission/next?id=1').then(r => r.json()).then(json => {
        state.data = json.mission;
        state.started = true;
        document.getElementById('start-screen').style.display = 'none';
        
        setInterval(() => { if(!state.paused) spawnWord(); }, 1800);
        setInterval(() => {
            if(!state.paused && !state.missionActive) {
                state.timer--;
                if(state.timer % 60 === 0) runMission();
            }
            updateUI();
        }, 1000);
        runMission();
    });
}
