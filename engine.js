/* ==============================================================
   KAMIZEN LIFE SYSTEM - ENGINE.JS (CORE ITERATOR)
   ============================================================== */

let state = {
    lang: 'es',
    mode: 'ACTION_LOOP', // ACTION_LOOP | MISSION_BLOCK
    timeLeft: 300,
    missionActive: false,
    score: 0
};

// --- SISTEMA DE AUDIO (Dopamina + SFX) ---
const AudioEngine = {
    // Música de fondo: Dopamina pero anti-estrés (Binaural/Zen-Step)
    bgm: new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'), 
    // Efecto de cristal roto / bomba
    pop: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    
    init() {
        this.bgm.loop = true;
        this.bgm.volume = 0.3;
    },

    playPop() {
        const sfx = this.pop.cloneNode();
        sfx.volume = 0.5;
        sfx.play();
    },

    speak(text) {
        if (!text) return;
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        // Buscar voz masculina con peso profesional
        msg.voice = voices.find(v => v.name.includes('Male') || v.name.includes('Google español')) || voices[0];
        msg.rate = 0.85; 
        msg.pitch = 0.9;
        speechSynthesis.speak(msg);
    }
};

/* ==============================================================
   ITERADOR DE BLOQUES JSON (EL DIRECTOR)
   ============================================================== */
async function runMission() {
    if (state.missionActive) return;
    
    state.missionActive = true;
    state.mode = 'MISSION_BLOCK';
    
    // Limpiar campo de batalla
    document.querySelectorAll('.word-float').forEach(w => w.remove());
    document.getElementById('overlay').style.display = 'flex';

    try {
        const res = await fetch(`/api/mission/next?lang=${state.lang}`);
        const data = await res.json();
        
        if (data.end) {
            AudioEngine.speak("Entrenamiento completado satisfactoriamente.");
            setTimeout(() => location.reload(), 3000);
            return;
        }

        // RECORRER BLOQUES b[] SECUENCIALMENTE
        const blocks = data.mission.b;
        for (const block of blocks) {
            await processBlock(block);
        }

    } catch (err) {
        console.error("Error en el flujo de misión:", err);
    }

    // Regresar al loop de acción
    document.getElementById('overlay').style.display = 'none';
    state.mode = 'ACTION_LOOP';
    state.missionActive = false;
}

async function processBlock(b) {
    const title = document.getElementById('phase-title');
    const desc = document.getElementById('phase-desc');
    const grid = document.getElementById('decision-grid');

    switch(b.t) {
        case "v": // Bloque Visual (Título)
            title.innerText = b.tx[state.lang];
            break;

        case "story": // Bloque Narrativo (Voz Obligatoria)
            grid.innerHTML = '';
            desc.innerText = b[state.lang];
            AudioEngine.speak(b[state.lang]);
            await new Promise(r => setTimeout(r, 4500)); // Tiempo de escucha activa
            break;

        case "d": // Bloque de Decisión (Pregunta + Feedback)
            grid.innerHTML = '';
            desc.innerText = b.q[state.lang];
            AudioEngine.speak(b.q[state.lang]);
            
            return new Promise((resolve) => {
                b.op.forEach((opt, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    // El JSON viene formateado como "English / Español"
                    btn.innerText = opt.split(' / ')[state.lang === 'es' ? 1 : 0];
                    
                    btn.onclick = () => {
                        const isCorrect = idx === b.c;
                        const feedback = b.ex[idx].split(' / ')[state.lang === 'es' ? 1 : 0];
                        
                        desc.innerText = feedback;
                        AudioEngine.speak(feedback);
                        
                        // Feedback Visual
                        document.body.className = isCorrect ? 'correct-flash' : 'wrong-flash';
                        state.score += isCorrect ? 50 : -20;
                        updateHUD();

                        grid.innerHTML = ''; // Bloquear otras opciones
                        setTimeout(() => {
                            document.body.className = '';
                            resolve();
                        }, 5000); // Pausa para asimilar el consejo del asesor
                    };
                    grid.appendChild(btn);
                });
            });

        case "br": // Bloque de Respiración o Silencio
            return new Promise(async (resolve) => {
                const circle = document.getElementById('breath-circle');
                const bTxt = document.getElementById('breath-txt');
                const bTimer = document.getElementById('breath-timer');
                
                circle.style.display = 'flex';
                circle.classList.add('inhale-anim');
                bTxt.innerText = b.tx[state.lang];
                AudioEngine.speak(b.tx[state.lang]);
                
                let seconds = b.d;
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
   LOOP DE ACCIÓN (PALABRAS FLOTANTES)
   ============================================================== */
function spawnWord() {
    if (state.mode !== 'ACTION_LOOP') return;

    const div = document.createElement('div');
    div.className = 'word-float';
    
    const words = state.lang === 'es' ? 
        ["RUIDO", "IMPULSO", "EGO", "CALMA", "ENFOQUE"] : 
        ["NOISE", "IMPULSE", "EGO", "CALM", "FOCUS"];
    
    div.innerText = words[Math.floor(Math.random() * words.length)];
    div.style.left = Math.random() * 80 + 10 + "vw";
    
    div.onclick = () => {
        AudioEngine.playPop(); // Sonido de cristales rotos
        div.style.transform = 'scale(2.5)';
        div.style.opacity = '0';
        state.score += 10;
        updateHUD();
        setTimeout(() => div.remove(), 150);
    };
    
    document.body.appendChild(div);
    // Limpieza automática si no se toca
    setTimeout(() => { if (div.parentNode) div.remove(); }, 6000);
}

/* ==============================================================
   SISTEMA DE CONTROL Y TIEMPO
   ============================================================== */
function updateHUD() {
    document.getElementById('score-box').innerText = `SCORE: ${state.score}`;
}

function startTimer() {
    const timerEl = document.getElementById('timer-box');
    const clock = setInterval(() => {
        if (state.timeLeft <= 0) {
            clearInterval(clock);
            alert("SESIÓN FINALIZADA");
            location.reload();
            return;
        }

        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        timerEl.innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

        // Disparar Misión del Asesor cada 45 segundos
        if (state.timeLeft % 45 === 0 && !state.missionActive) {
            runMission();
        }
    }, 1000);
}

function toggleLang() {
    state.lang = (state.lang === 'es') ? 'en' : 'es';
    document.getElementById('lang-btn').innerText = state.lang.toUpperCase();
}

// Inicialización por interacción del usuario (Requerido por navegadores para Audio)
window.onclick = () => {
    if (AudioEngine.bgm.paused) {
        AudioEngine.init();
        AudioEngine.bgm.play();
        startTimer();
        setInterval(spawnWord, 1300); // Iniciar lluvia de palabras
        runMission(); // Primera misión inmediata
    }
};
