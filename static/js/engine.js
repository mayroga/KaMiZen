let state = {
    lang: 'en', // Por defecto Inglés
    mode: 'ACTION',
    timeLeft: 300,
    peace: 50,
    missionActive: false,
    started: false
};

const AudioEngine = {
    init() {
        this.bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.2;
        this.bgm.play().catch(e => console.log("Audio waiting for interaction"));
    },
    speak(text) {
        if (!text) return;
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.lang === 'es' ? 'es-ES' : 'en-US';
        msg.rate = 0.9;
        speechSynthesis.speak(msg);
    }
};

function toggleLang() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    document.getElementById('label-peace').innerText = state.lang === 'es' ? 'PAZ INTERIOR' : 'INTERNAL PEACE';
    document.getElementById('breath-txt').innerText = state.lang === 'es' ? 'RESPIRA' : 'BREATHE';
}

async function runMission() {
    if (state.missionActive || !state.started) return;
    state.missionActive = true;
    state.mode = 'MISSION';

    document.querySelectorAll('.word-float').forEach(w => w.remove());
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    try {
        const res = await fetch(`/api/mission/next?lang=${state.lang}`);
        const data = await res.json();
        
        for (const block of data.mission.b) {
            await processBlock(block);
        }
    } catch (err) {
        console.error("Mission error:", err);
    }

    overlay.style.display = 'none';
    state.mode = 'ACTION';
    state.missionActive = false;
}

async function processBlock(b) {
    const title = document.getElementById('phase-title');
    const desc = document.getElementById('phase-desc');
    const grid = document.getElementById('decision-grid');
    const circle = document.getElementById('breath-circle');

    grid.innerHTML = '';
    circle.style.display = 'none';

    switch(b.t) {
        case "v":
            title.innerText = b.tx[state.lang];
            break;

        case "story":
            desc.innerText = b[state.lang];
            AudioEngine.speak(b[state.lang]);
            await new Promise(r => setTimeout(r, 6000));
            break;

        case "d":
            desc.innerText = b.q[state.lang];
            AudioEngine.speak(b.q[state.lang]);
            return new Promise((resolve) => {
                b.op.forEach((opt, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.innerText = opt.split(' / ')[state.lang === 'es' ? 1 : 0];
                    btn.onclick = () => {
                        const isCorrect = idx === b.c;
                        btn.className = `choice-btn ${isCorrect ? 'correct-choice' : 'wrong-choice'}`;
                        
                        const feedback = b.ex[idx].split(' / ')[state.lang === 'es' ? 1 : 0];
                        desc.innerText = feedback;
                        AudioEngine.speak(feedback);
                        
                        state.peace = isCorrect ? Math.min(100, state.peace + 15) : Math.max(0, state.peace - 20);
                        updateUI();
                        
                        setTimeout(() => resolve(), 5000);
                    };
                    grid.appendChild(btn);
                });
            });

        case "br":
            circle.style.display = 'flex';
            circle.classList.add('inhale-anim');
            AudioEngine.speak(state.lang === 'es' ? 'Inhala y exhala' : 'Inhale and exhale');
            let s = b.d || 4;
            while (s > 0) {
                document.getElementById('breath-timer').innerText = s-- + "s";
                await new Promise(r => setTimeout(r, 1000));
            }
            circle.classList.remove('inhale-anim');
            circle.style.display = 'none';
            break;
    }
}

function spawnWord() {
    if (state.mode !== 'ACTION' || !state.started) return;
    const div = document.createElement('div');
    div.className = 'word-float';
    const words = state.lang === 'es' ? ["EGO", "RUIDO", "PRISA", "DUDAS"] : ["EGO", "NOISE", "HASTE", "DOUBTS"];
    div.innerText = words[Math.floor(Math.random() * words.length)];
    div.style.left = Math.random() * 70 + 15 + "vw";
    div.onclick = () => {
        state.peace = Math.min(100, state.peace + 3);
        updateUI();
        div.remove();
    };
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 7000);
}

function updateUI() {
    document.getElementById('bar-peace').style.width = state.peace + "%";
}

function startSystem() {
    state.started = true;
    document.getElementById('start-screen').style.display = 'none';
    AudioEngine.init();
    
    setInterval(() => {
        if (state.timeLeft <= 0) return;
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        document.getElementById('timer-box').innerText = `${m}:${s.toString().padStart(2,'0')}`;
        if (state.timeLeft % 45 === 0) runMission();
    }, 1000);

    setInterval(spawnWord, 1200);
    runMission();
}
