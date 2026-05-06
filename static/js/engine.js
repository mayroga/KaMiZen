/* =============================================================
   KaMiZen ENGINE V3 - LINEAR PROTOCOL (STRICT)
   Flow: Story(N) -> Mission(N) -> Breathing -> Repeat
   ============================================================= */

let state = {
    name: "",
    step: "welcome", // welcome, training, breathing
    currentIdx: 0,   // Índice unificado para Story 1 -> Mission 1
    lang: "en",
    stories: [],
    missions: [],
    initialized: false
};

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    try {
        const [sRes, mRes] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        const sData = await sRes.json();
        const mData = await mRes.json();
        
        state.stories = sData.stories || [];
        state.missions = mData.missions || [];
        state.initialized = true;
    } catch (err) {
        console.error("Error de carga de base de datos");
    }
}

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = state.lang === "en" ? "en-US" : "es-ES";
    window.speechSynthesis.speak(msg);
}

function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    // 1. BIENVENIDA
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <input id="nameInput" type="text" placeholder="Full Name" />
            </div>
            <button class="primary" onclick="startApp()">BEGIN PROTOCOL</button>
        `;
        return;
    }

    // 2. FASE DE ENTRENAMIENTO (STORY + MISSION)
    if (state.step === "training") {
        const s = state.stories[state.currentIdx];
        const m = state.missions[state.currentIdx];

        if (!s || !m) {
            app.innerHTML = "<h1>Entrenamiento Completo</h1>";
            return;
        }

        const sText = state.lang === "en" ? s.en : s.es;
        
        // Bloques de la misión
        const v = m.b.find(x => x.t === "v")?.tx;
        const meta = m.b.find(x => x.story)?.story;
        const d = m.b.find(x => x.t === "d");

        app.innerHTML = `
            <h3 style="color:#3b82f6;">Step ${state.currentIdx + 1}: Knowledge</h3>
            <div class="card">
                <p style="font-size:1.2em; font-weight:bold;">${sText}</p>
            </div>
            
            <h3 style="color:#facc15;">Action: ${state.lang === 'en' ? v.en : v.es}</h3>
            <div class="card">
                <p style="font-style:italic; border-bottom:1px solid #333; padding-bottom:10px;">
                    "${state.lang === 'en' ? meta.en : meta.es}"
                </p>
                <p style="margin-top:15px; font-weight:bold;">${state.lang === 'en' ? d.q.en : d.q.es}</p>
                
                <div id="answers">
                    ${d.op.map((opt, i) => `
                        <div class="answer" onclick="checkAnswer(${i}, ${d.c}, ${JSON.stringify(d.ex).replace(/"/g, '&quot;')})">
                            ${opt}
                        </div>
                    `).join("")}
                </div>
                <div id="feedback" style="margin-top:15px;"></div>
            </div>
            
            <button id="nextBtn" class="primary" style="display:none;" onclick="goToBreathing()">PROCEED TO RECOVERY</button>
        `;
        speak(sText);
        return;
    }

    // 3. FASE DE RESPIRACIÓN (ENTRE CADA PASO)
    if (state.step === "breathing") {
        const m = state.missions[state.currentIdx];
        const breathAuto = m.b.find(x => x.t === "breath_auto");
        const info = state.lang === "en" ? breathAuto.inf.en : breathAuto.inf.es;

        app.innerHTML = `
            <h2>Nervous System Recovery</h2>
            <div class="circle" style="background:#1e3a8a; border: 5px solid #3b82f6;">
                <span id="breathText" style="color:white; font-weight:bold; font-size:24px;">Inhale</span>
            </div>
            <div class="card">
                <p style="text-align:center;">${info}</p>
            </div>
            <button class="primary" id="finishBreath" style="display:none;" onclick="nextStep()">NEXT LEVEL</button>
        `;
        startBreathingCycle(breathAuto.d || 30);
        return;
    }
}

/* --- LÓGICA DE CONTROL --- */

function startApp() {
    state.name = document.getElementById("nameInput").value || "User";
    state.step = "training";
    render();
}

function checkAnswer(idx, correct, explanations) {
    const fb = document.getElementById("feedback");
    const explanation = explanations[idx];
    const isCorrect = idx === correct;

    fb.innerHTML = `
        <div style="padding:10px; border-radius:8px; background:${isCorrect ? '#064e3b' : '#7f1d1d'};">
            <p><strong>${isCorrect ? '✓ CORRECT' : '✗ REVISE'}</strong></p>
            <p style="font-size:0.9em;">${explanation}</p>
        </div>
    `;
    
    if (isCorrect) {
        document.getElementById("nextBtn").style.display = "block";
        speak("Correct. " + explanation);
    } else {
        speak("Observe. " + explanation);
    }
}

function goToBreathing() {
    state.step = "breathing";
    render();
}

function startBreathingCycle(duration) {
    let timeLeft = duration;
    let inhale = true;
    
    const interval = setInterval(() => {
        const el = document.getElementById("breathText");
        if (!el) { clearInterval(interval); return; }
        
        el.innerText = inhale ? "INHALE" : "EXHALE";
        speak(inhale ? "Inhale" : "Exhale");
        inhale = !inhale;
        
        timeLeft -= 4;
        if (timeLeft <= 0) {
            clearInterval(interval);
            document.getElementById("finishBreath").style.display = "block";
        }
    }, 4000);
}

function nextStep() {
    state.currentIdx++;
    state.step = "training";
    render();
}
