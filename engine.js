/* =========================
   ESTADO GLOBAL Y CONFIG
   ========================= */
let lang = "es"; 
let gameMode = "words"; // words | question | breathing

let state = {
    score: 0,
    timer: 300,
    stats: { respect: 50, peace: 50, lead: 50, money: 100, happy: 50, safety: 100 },
    spawnRate: 1400,
    maxWords: 18
};

/* =========================
   🔊 VOICE ENGINE (MASCULINO)
   ========================= */
function speak(text) {
    if (!text) return;
    speechSynthesis.cancel(); 
    const u = new SpeechSynthesisUtterance(text);
    
    // Configurar voz
    const voices = speechSynthesis.getVoices();
    // Buscar una voz masculina (Google Spanish o similar)
    u.voice = voices.find(v => v.name.includes('Male') || v.name.includes('México') || v.name.includes('Spain')) || voices[0];
    
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.rate = 0.9; // Un poco más lento para peso y autoridad
    u.pitch = 0.8; // Tono más grave/profundo
    speechSynthesis.speak(u);
}

/* =========================
   📊 HUD & UI
   ========================= */
function updateHUD() {
    document.getElementById("score-box").innerText = `SCORE: ${state.score}`;
    
    let m = Math.floor(state.timer / 60);
    let s = state.timer % 60;
    document.getElementById("timer-box").innerText = 
        `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

    for (let k in state.stats) {
        let el = document.getElementById("v-" + k);
        if (el) el.innerText = state.stats[k];
    }
}

/* =========================
   🧠 LOGICA DE PREGUNTAS (API)
   ========================= */
async function triggerQuestion() {
    gameMode = "question";
    
    try {
        const res = await fetch(`/api/mission/next?lang=${lang}`);
        const data = await res.json();

        if (data.end) {
            alert("ENTRENAMIENTO FINALIZADO");
            location.reload();
            return;
        }

        const overlay = document.getElementById("overlay");
        const grid = document.getElementById("decision-grid");
        const desc = document.getElementById("phase-desc");
        const title = document.getElementById("phase-title");
        const cont = document.getElementById("continue-btn");

        overlay.style.display = "flex";
        grid.innerHTML = "";
        cont.style.display = "none";
        
        title.innerText = data.title;
        desc.innerText = data.story || data.header;
        
        // Voz al iniciar la fase
        speak(desc.innerText);

        data.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "choice-btn";
            btn.innerText = opt.text; // Ya viene filtrado por el servidor

            btn.onclick = () => {
                AudioEngine.click();
                desc.innerText = opt.explanation;
                speak(opt.explanation);

                // Feedback visual
                if (opt.is_correct) {
                    state.score += 30;
                    document.body.classList.add("correct-flash");
                } else {
                    state.score -= 20;
                    document.body.classList.add("wrong-flash");
                }

                setTimeout(() => {
                    document.body.classList.remove("correct-flash", "wrong-flash");
                }, 400);

                // Bloquear otras opciones
                document.querySelectorAll(".choice-btn").forEach(b => b.disabled = true);
                
                // Preparar continuación (Respira o Siguiente)
                cont.style.display = "block";
                window.currentMissionsBlocks = data.interactive_blocks;
                
                if (window.currentMissionsBlocks && window.currentMissionsBlocks.length > 0) {
                    cont.innerText = lang === "es" ? "INICIAR PRÁCTICA" : "START PRACTICE";
                    cont.onclick = () => runBreathing(window.currentMissionsBlocks);
                } else {
                    cont.onclick = () => { overlay.style.display = "none"; gameMode = "words"; };
                }
                updateHUD();
            };
            grid.appendChild(btn);
        });
    } catch (e) {
        console.error("Error en API:", e);
    }
}

/* =========================
   🧘 PRÁCTICA DE RESPIRACIÓN
   ========================= */
async function runBreathing(blocks) {
    gameMode = "breathing";
    document.getElementById("overlay").style.display = "none";
    const circle = document.getElementById("breath-circle");
    const txt = document.getElementById("breath-txt");
    const bTimer = document.getElementById("breath-timer");

    circle.style.display = "flex";

    for (let block of blocks) {
        txt.innerText = block.text;
        speak(block.text);
        circle.className = (block.type === 'br') ? 'inhale-anim' : '';
        
        let count = block.duration;
        while (count > 0) {
            bTimer.innerText = count + "s";
            await new Promise(r => setTimeout(r, 1000));
            count--;
        }
    }

    circle.style.display = "none";
    gameMode = "words"; // Volver al juego de palabras
    phaseStart = Date.now(); // Resetear el timer de fase
}

/* =========================
   🌊 SISTEMA DE PALABRAS
   ========================= */
const words = {
    power: ["CONTROL", "CALMA", "ENFOQUE"],
    risk: ["RABIA", "IMPULSO", "IGNORAR"],
    silence: ["RESPIRA", "ESPERA", "OBSERVA"]
};

let activeWords = 0;
let lastSpawn = 0;

function spawnWord() {
    if (gameMode !== "words" || activeWords > state.maxWords) return;

    let now = Date.now();
    if (now - lastSpawn < state.spawnRate) return;
    lastSpawn = now;

    const cats = Object.keys(words);
    const c = cats[Math.floor(Math.random() * cats.length)];

    let div = document.createElement("div");
    div.className = "floating";
    div.innerText = words[c][Math.floor(Math.random() * words[c].length)];
    div.style.left = Math.random() * 80 + "vw";

    activeWords++;
    div.onclick = () => {
        AudioEngine.click();
        state.score += (c === "risk") ? -20 : 10;
        updateHUD();
        div.remove();
        activeWords--;
    };

    document.body.appendChild(div);
    setTimeout(() => { if (div.parentNode) { div.remove(); activeWords--; } }, 6000);
}

/* =========================
   🔁 LOOP PRINCIPAL
   ========================= */
let phaseStart = Date.now();

function loop() {
    requestAnimationFrame(loop);

    if (gameMode === "words") {
        spawnWord();
        // Cada 45 segundos, lanzar una pregunta de asesoría
        if (Date.now() - phaseStart > 45000) {
            document.querySelectorAll(".floating").forEach(e => e.remove());
            activeWords = 0;
            triggerQuestion();
        }
    }
}

function toggleLang() {
    lang = (lang === "en") ? "es" : "en";
    document.getElementById("lang-btn").innerText = lang.toUpperCase();
}

// Iniciar
updateHUD();
loop();
