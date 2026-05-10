/* =========================================================
   KAMIZEN ENGINE V13 - AUTOMATIC & TIME-LIMITED EDITION
   ✔ Avance Automático: Sin necesidad de botón Continue.
   ✔ Temporizador Global: 15 Minutos de sesión máxima.
   ✔ Mensajes de Cierre: Aleatorios y sin repetición inmediata.
   ✔ Narración Completa y Guía de Respiración Sincronizada.
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading", 
    speechLocked: false,
    initialized: false,
    timer: null,
    timeLeft: 0,
    sessionTimeout: null,
    isSessionEnded: false
};

/* =========================
   SISTEMA DE CIERRE (15 MIN)
========================= */
function startGlobalSessionTimer() {
    // 15 minutos = 900,000 ms
    state.sessionTimeout = setTimeout(endSession, 900000);
}

function endSession() {
    state.isSessionEnded = true;
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    
    const messages = [
        `<h2>🌟 GREAT JOB TODAY</h2>
         <p>You completed your KAMIZEN session. Your brain and body only need a few focused minutes to grow stronger.</p>
         <p>More time does not always mean more progress. KAMIZEN is designed to help you train calmly, not endlessly.</p>
         <ul style="text-align:left; display:inline-block;">
            <li>✔ Now you are ready to start your class</li>
            <li>✔ Rest your mind</li>
            <li>✔ Go play</li>
            <li>✔ Talk with your family</li>
            <li>✔ Explore the real world</li>
            <li>✔ Come back tomorrow stronger</li>
         </ul>
         <p>Small daily training creates powerful minds. See you next session, warrior. 🛡️</p>`,
        
        `<h2>🧠 Mission Complete</h2>
         <p>Your mind trained for 15 minutes today. That is enough for your brain to grow stronger.</p>
         <p>KAMIZEN is not about staying longer. It is about training wisely, which means you are now ready to begin your classes or your next school subject. 📚</p>
         <p>Now go enjoy your day, move your body, smile, learn, and live. You can always return tomorrow for another mission. See you soon, champion. ⭐</p>`
    ];

    // Selección aleatoria
    const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
    
    document.getElementById("app").innerHTML = `
        <div class="card center" style="border: 2px solid var(--success); animation: fadeIn 1s;">
            ${selectedMessage}
            <button onclick="location.reload()" style="margin-top:20px; background:var(--success)">FINISH SESSION</button>
        </div>
    `;
    
    // Narrar el mensaje de cierre (limpio de etiquetas HTML)
    const plainText = selectedMessage.replace(/<[^>]*>/g, '');
    narrate(plainText);
}

/* =========================
   SISTEMA DE PERSISTENCIA
========================= */
function saveProgress() {
    if (state.isSessionEnded) return;
    localStorage.setItem('kamizen_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('kamizen_save');
    if (saved) {
        const data = JSON.parse(saved);
        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
    }
}

/* =========================
   INICIALIZACIÓN
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    try {
        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();
        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a, b) => a.id - b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a, b) => a.id - b.id) : [];
        state.initialized = true;
    } catch (err) {
        app.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* =========================
   MOTOR DE RENDERIZADO
========================= */
function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>15-Minute Neural Training</p>
            <button onclick="startSystem()">START MISSION</button>
        </div>
    `;
}

function startSystem() {
    state.phase = "story";
    startGlobalSessionTimer(); // Inicia el reloj de 15 min
    render();
}

function render() {
    if (!state.initialized || state.isSessionEnded) return;
    saveProgress();
    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0; state.currentBlock = 0;
        state.phase = "story"; return render();
    }

    if (state.phase === "story") {
        app.innerHTML = `
            <div class="card">
                <h2 style="color:var(--primary)">STORY ${story.id}</h2>
                <p style="font-size:1.2rem;">${story.en || ""}</p>
            </div>
            <div class="small center">Narrating... Next step is automatic.</div>
        `;
        narrate(`${story.t}. ${story.en}`, () => {
            setTimeout(startMission, 1000); // Salto automático a la misión
        });
    } else {
        const block = mission.b[state.currentBlock];
        if (!block) { nextStory(); return; }
        renderBlock(block);
    }
}

function renderBlock(block) {
    const app = document.getElementById("app");
    let html = "";
    let textToRead = "";

    const timerUI = `<div class="card center" style="border: 3px solid var(--primary); background: #0f172a;">
        <h1 id="timerDisplay" style="font-size:4rem;margin:0;">00:24</h1>
    </div>`;

    // Tipos de bloques (Visual, Historia, Respiración, Silencio, Pregunta, Recompensa)
    if (block.t === "v" || block.t === "h") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        textToRead = block.tx?.en;
    } else if (block.story) {
        html += `<div class="card"><p>${block.story.en || ""}</p></div>`;
        textToRead = block.story.en;
    } else if (block.t === "breath_auto" || block.t === "br") {
        html += timerUI + `
            <div class="card center">
                <div class="breath-circle" id="breathCircle"><span id="breathLabel">READY</span></div>
                <h3>${block.tx?.en || ""}</h3>
            </div>`;
        textToRead = `${block.tx?.en}. Breathe with the circle.`;
    } else if (block.t === "sil") {
        html += timerUI + `<div class="card"><h3>${block.tx?.en || ""}</h3><p>${block.inf?.en || ""}</p></div>`;
        textToRead = `${block.tx?.en}. Practice silence.`;
    } else if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;
        block.op?.forEach((opt, i) => {
            html += `<div class="answer" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${block.q?.en}. Choose an answer.`;
    } else if (block.t === "r") {
        html += `<div class="card center"><h2>⭐ ${block.tx || "REWARD"}</h2><p>+${block.p || 0} XP</p></div>`;
        textToRead = `${block.tx}. Reward points added.`;
    }

    app.innerHTML = html;

    narrate(textToRead, () => {
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
        } else if (block.t !== "d") {
            setTimeout(nextBlock, 2000); // Salto automático tras 2 seg de terminar de hablar
        }
    });
}

/* =========================
   LÓGICA DE VOZ Y ACCIÓN
========================= */
function narrate(text, callback) {
    if (!text || state.isSessionEnded) { if (callback) callback(); return; }
    state.speechLocked = true;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1.0;
    speech.onend = () => { 
        state.speechLocked = false; 
        if (callback) callback(); 
    };
    window.speechSynthesis.speak(speech);
}

function startGuidedBreathing() {
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    let inhale = true;
    const step = () => {
        if (!circle || state.timeLeft <= 0) return;
        label.innerText = inhale ? "INHALE" : "EXHALE";
        circle.style.transform = inhale ? "scale(1.4)" : "scale(0.8)";
        inhale = !inhale;
    };
    step();
    const aniInterval = setInterval(() => {
        if (state.timeLeft <= 0) { clearInterval(aniInterval); return; }
        step();
    }, 4000);
}

function selectAnswer(index, correct, explanations) {
    if (state.speechLocked) return;
    const explanation = explanations?.[index] || "";
    document.getElementById("app").innerHTML += `<div class="card"><p>${explanation}</p></div>`;
    narrate(explanation, () => {
        setTimeout(nextBlock, 2500); // Avanza solo después de la explicación
    });
}

function startCountdown(seconds, onComplete) {
    state.timeLeft = seconds;
    const display = document.getElementById("timerDisplay");
    clearInterval(state.timer);
    state.timer = setInterval(() => {
        state.timeLeft--;
        if (display) display.innerText = `00:${String(state.timeLeft).padStart(2, '0')}`;
        if (state.timeLeft <= 0) { clearInterval(state.timer); onComplete(); }
    }, 1000);
}

function nextBlock() { state.currentBlock++; render(); }
function startMission() { state.phase = "mission"; state.currentBlock = 0; render(); }
function nextStory() { state.currentIndex++; state.phase = "story"; state.currentBlock = 0; render(); }
