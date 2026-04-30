/* ==============================================================
   AL CIELO: KAMIZEN LIFE SYSTEM - ENGINE.JS (ESTABLE)
   ============================================================== */

let state = {
    lang: 'es',
    mode: 'ACTION', // ACTION | MISSION | BREATH
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
        // Selección de voz con peso profesional
        msg.voice = voices.find(v => v.name.includes('Male') || v.name.includes('Google español')) || voices[0];
        msg.rate = 0.85;
        msg.pitch = 0.9;
        speechSynthesis.speak(msg);
    }
};

/* ==============================================================
   ITERADOR DE MISIONES (CONTROL SECUENCIAL)
   ============================================================== */
async function runMission() {
    if (state.missionActive) return;
    state.missionActive = true;
    state.mode = 'MISSION';

    // Limpieza de interfaz para enfoque
    document.querySelectorAll('.word-float').forEach(w => w.remove());
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    try {
        const res = await fetch(`/api/mission/next?lang=${state.lang}`);
        const data = await res.json();
        
        if (data.end) {
            AudioEngine.speak("Entrenamiento finalizado.");
            setTimeout(() => location.reload(), 3000);
            return;
        }

        // Procesa bloques b[] uno por uno
        for (const block of data.mission.b) {
            await processBlock(block);
        }

    } catch (err) {
        console.error("Fallo en la carga de misión:", err);
    }

    overlay.style.display = 'none';
    state.mode = 'ACTION';
    state.missionActive = false;
}

async function processBlock(b) {
    const title = document.getElementById('phase-title');
    const desc = document.getElementById('phase-desc');
    const grid = document.getElementById('decision-grid');

    document.body.className = ''; // Reset de efectos visuales

    switch(b.t) {
        case "v": // Título de fase
            title.innerText = b.tx[state.lang];
            break;

        case "story": // Narrativa obligatoria
            grid.innerHTML = '';
            desc.innerText = b[state.lang];
            AudioEngine.speak(b[state.lang]);
            await new Promise(r => setTimeout(r, 5500)); 
            break;

        case "d": // Decisión con Feedback de peso
            grid.innerHTML = '';
            desc.innerText = b.q[state.lang];
            AudioEngine.speak(b.q[state.lang]);
            
            return new Promise((resolve) => {
                b.op.forEach((opt, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.innerText = opt.split(' / ')[state.lang === 'es' ? 1 : 0];
                    
                    btn.onclick = () => {
                        const isCorrect = idx === b.c;
                        const feedback = b.ex[idx].split(' / ')[state.lang === 'es' ? 1 : 0];
                        
                        // Feedback visual inmediato
                        document.body.className = isCorrect ? 'correct-flash' : 'wrong-flash';
                        
                        desc.innerText = feedback;
                        AudioEngine.speak(feedback);
                        grid.innerHTML = ''; 

                        // Ajuste de métricas de paz interna
                        state.peace = isCorrect ? Math.min(100, state.peace + 10) : Math.max(0, state.peace - 15);
                        updateUI();

                        // Pausa para asimilar el consejo
                        setTimeout(() => {
                            document.body.className = '';
                            resolve();
                        }, 5000);
                    };
                    grid.appendChild(btn);
                });
            });

        case "br": // Módulo de Respiración
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

/* ==============================================================
   DINÁMICA DE ACCIÓN (FLOTANTES)
   ============================================================== */
function spawnWord() {
    if (state.mode !== 'ACTION') return;

    const div = document.createElement('div');
    div.className = 'word-float';
    const words = state.lang === 'es' ? ["EGO", "RUIDO", "PRISA", "DUDAS"] : ["EGO", "NOISE", "HASTE", "DOUBTS"];
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
    const sBar = document.getElementById('bar-safety');
    if(pBar) pBar.style.width = state.peace + "%";
    if(sBar) sBar.style.width = state.safety + "%";
}

/* ==============================================================
   INICIO DE SISTEMA
   ============================================================== */
function startSystem() {
    const timerEl = document.getElementById('timer-box');
    
    // Reloj maestro de 5 minutos
    const clock = setInterval(() => {
        if (state.timeLeft <= 0) {
            clearInterval(clock);
            return;
        }

        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        if(timerEl) timerEl.innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

        // Disparador programado de misiones cada 45 segundos
        if (state.timeLeft % 45 === 0 && state.mode === 'ACTION') {
            runMission();
        }
    }, 1000);

    setInterval(spawnWord, 1500);
    
    // Lanzamiento inicial
    runMission();
}

// Activación por interacción (Protocolo de Navegador)
window.onclick = () => {
    if (!window.started) {
        window.started = true;
        AudioEngine.init();
        AudioEngine.bgm.play().catch(console.warn);
        startSystem();
    }
};
