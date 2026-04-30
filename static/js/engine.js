let state = {
    lang: 'en',
    mode: 'ACTION',
    timeLeft: 300,
    peace: 50,
    missionActive: false,
    started: false,
    data: null,
    currentMissionIdx: 0
};

const AudioEngine = {
    speak(text) {
        if (!text) return;
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.lang === 'es' ? 'es-ES' : 'en-US';
        speechSynthesis.speak(msg);
    }
};

async function loadData() {
    const res = await fetch('/api/mission/next?id=1'); // En tu main.py asegúrate de que devuelva el JSON completo
    const json = await res.json();
    state.data = json.mission;
    updateRule();
}

function toggleLang() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
}

function updateRule() {
    const rules = state.data.rules;
    document.getElementById('rule-display').innerText = rules[Math.floor(Math.random() * rules.length)];
}

async function runMission() {
    if (state.missionActive || !state.started) return;
    state.missionActive = true;
    state.mode = 'MISSION';

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    const mission = state.data.missions[state.currentMissionIdx];
    
    for (const block of mission.b) {
        await processBlock(block);
    }

    state.currentMissionIdx = (state.currentMissionIdx + 1) % state.data.missions.length;
    overlay.style.display = 'none';
    state.mode = 'ACTION';
    state.missionActive = false;
}

async function processBlock(b) {
    const title = document.getElementById('phase-title');
    const desc = document.getElementById('phase-desc');
    const grid = document.getElementById('decision-grid');
    const circle = document.getElementById('breath-circle');
    const info = document.getElementById('info-box');

    grid.innerHTML = '';
    circle.style.display = 'none';
    info.innerText = '';

    switch(b.t) {
        case "v":
            title.innerText = b.tx[state.lang];
            break;
        case "h":
            desc.innerText = b.tx[state.lang];
            break;
        case "story":
            desc.innerText = b[state.lang];
            AudioEngine.speak(b[state.lang]);
            await new Promise(r => setTimeout(r, 5000));
            break;
        case "br":
        case "breath_auto":
            circle.style.display = 'flex';
            circle.classList.add('inhale-anim');
            desc.innerText = b.tx[state.lang];
            if(b.inf) info.innerText = b.inf[state.lang];
            let s = b.d || 4;
            while (s > 0) {
                document.getElementById('breath-timer').innerText = s-- + "s";
                await new Promise(r => setTimeout(r, 1000));
            }
            circle.classList.remove('inhale-anim');
            break;
        case "sil":
            desc.innerText = b.tx[state.lang];
            info.innerText = b.inf[state.lang];
            let st = b.d;
            while (st > 0) {
                title.innerText = `SILENCE: ${st--}s`;
                await new Promise(r => setTimeout(r, 1000));
            }
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
                        setTimeout(resolve, 4000);
                    };
                    grid.appendChild(btn);
                });
            });
    }
}

function spawnWord() {
    if (state.mode !== 'ACTION' || !state.started) return;
    const div = document.createElement('div');
    div.className = 'word-float';
    const words = state.data.ui.fw;
    div.innerText = words[Math.floor(Math.random() * words.length)];
    div.style.left = Math.random() * 80 + 10 + "vw";
    div.onclick = () => {
        state.peace = Math.min(100, state.peace + 2);
        document.getElementById('bar-peace').style.width = state.peace + "%";
        div.remove();
    };
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 8000);
}

function startSystem() {
    loadData().then(() => {
        state.started = true;
        document.getElementById('start-screen').style.display = 'none';
        setInterval(spawnWord, 1500);
        setInterval(() => {
            if(state.timeLeft > 0) {
                state.timeLeft--;
                const m = Math.floor(state.timeLeft / 60);
                const s = state.timeLeft % 60;
                document.getElementById('timer-box').innerText = `${m}:${s.toString().padStart(2,'0')}`;
                if(state.timeLeft % 60 === 0) runMission();
            }
        }, 1000);
        runMission();
    });
}
