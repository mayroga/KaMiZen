/* ==============================================================
   AL CIELO: KAMIZEN LIFE SYSTEM - ENGINE.JS (CONECTADO)
   ============================================================== */

let state = {
    lang: 'es',
    mode: 'ACTION', 
    timeLeft: 300,
    peace: 50,
    safety: 100,
    missionActive: false
};

const AudioEngine = {
    bgm: new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'),
    pop: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    
    init() {
        this.bgm.loop = true;
        this.bgm.volume = 0.2;
    },

    speak(text) {
        if (!text) return;
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        // Buscar voz masculina profesional (Asesor)
        msg.voice = voices.find(v => v.name.includes('Male') || v.name.includes('Google español')) || voices[0];
        msg.rate = 0.85;
        msg.pitch = 0.9;
        speechSynthesis.speak(msg);
    }
};

async function runMission() {
    if (state.missionActive) return;
    state.missionActive = true;
    state.mode = 'MISSION';

    document.querySelectorAll('.word-float').forEach(w => w.remove());
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    try {
        // Llamada al endpoint de tu main.py
        const res = await fetch(`/api/mission/next?lang=${state.lang}`);
        if (!res.ok) throw new Error("Servidor no responde");
        const data = await res.json();
        
        for (const block of data.mission.b) {
            await processBlock(block);
        }
    } catch (err) {
        console.error("Error conectando con main.py:", err);
    }

    overlay.style.display = 'none';
    state.mode = 'ACTION';
    state.missionActive = false;
}

async function processBlock(b) {
    const title = document.getElementById('phase-title');
    const desc = document.getElementById('phase-desc');
    const grid = document.getElementById('decision-grid');

    document.body.className = '';

    switch(b.t) {
        case "v":
            title.innerText = b.tx[state.lang];
            break;

        case "story":
            grid.innerHTML = '';
            desc.innerText = b[state.lang];
            AudioEngine.speak(b[state.lang]);
            await new Promise(r => setTimeout(r, 6000)); 
            break;

        case "d":
            grid.innerHTML = '';
            desc.innerText = b.q[state.lang];
            AudioEngine.speak(b.q[state.lang]);
            
            return new Promise((resolve) => {
                b.op.forEach((opt, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.innerText = opt.split(' / ')[state.lang === 'es' ? 1 : 0];
                    
                    btn.onclick = () => {
                        const feedback = b.ex[idx].split(' / ')[state.lang === 'es' ? 1 : 0];
                        const isCorrect = idx === b.c;
                        
                        document.body.className = isCorrect ? 'correct-flash' : 'wrong-flash';
                        desc.innerText = feedback;
                        AudioEngine.speak(feedback);
                        grid.innerHTML = ''; 

                        state.peace = isCorrect ? Math.min(100, state.peace + 10) : Math.max(0, state.peace - 15);
                        updateUI();

                        setTimeout(() => {
                            document.body.className = '';
                            resolve();
                        }, 5000);
                    };
                    grid.appendChild(btn);
                });
            });

        case "br":
            return new Promise(async (resolve) => {
                const circle = document.getElementById('breath-circle');
                const bTxt = document.getElementById('breath-txt');
                const bTimer = document.getElementById('breath-timer');
                circle.style.display = 'flex';
                circle.classList.add('inhale-anim');
                bTxt.innerText = b.tx[state.lang];
                AudioEngine.speak(b.tx[state.lang]);
                let seconds = b.d || 4;
                while (seconds > 0) {
                    bTimer.innerText = seconds-- + "s";
                    await new Promise(r => setTimeout(r, 1000));
                }
                circle.style.display = 'none';
                circle.classList.remove('inhale-anim');
                resolve();
            });
    }
}

function spawnWord() {
    if (state.mode !== 'ACTION') return;
    const div = document.createElement('div');
    div.className = 'word-float';
    const words = state.lang === 'es' ? ["EGO", "RUIDO", "PRISA"] : ["EGO", "NOISE", "HASTE"];
    div.innerText = words[Math.floor(Math.random() * words.length)];
    div.style.left = Math.random() * 80 + 10 + "vw";
    div.onclick = () => {
        AudioEngine.pop.play();
        state.peace = Math.min(100, state.peace + 2);
        updateUI();
        div.remove();
    };
    document.body.appendChild(div);
    setTimeout(() => { if(div.parentNode) div.remove(); }, 6000);
}

function updateUI() {
    const pBar = document.getElementById('bar-peace');
    if(pBar) pBar.style.width = state.peace + "%";
}

function startSystem() {
    setInterval(() => {
        if (state.timeLeft <= 0) return;
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        document.getElementById('timer-box').innerText = `${m}:${s.toString().padStart(2,'0')}`;

        if (state.timeLeft % 45 === 0 && state.mode === 'ACTION') runMission();
    }, 1000);

    setInterval(spawnWord, 1500);
    runMission(); // Arranca la primera misión del main.py
}

window.onclick = () => {
    if (!window.started) {
        window.started = true;
        AudioEngine.init();
        AudioEngine.bgm.play();
        startSystem();
    }
};
