/* =============================================================
   KaMiZen ENGINE V3 - RECOVERY MODE
   ============================================================= */

let state = {
    name: "",
    step: "welcome",
    lang: "en",
    stories: [],
    missions: [],
    sIndex: 0,
    mIndex: 0
};

// 1. CARGA INICIAL CON ALERTAS DE ERROR
window.addEventListener("load", async () => {
    const app = document.getElementById("app");
    console.log("Iniciando carga de datos...");

    try {
        const storiesRes = await fetch("/api/stories");
        const missionsRes = await fetch("/api/missions");

        if (!storiesRes.ok || !missionsRes.ok) {
            throw new Error("No se pudieron obtener los datos de la API");
        }

        const storiesData = await storiesRes.json();
        const missionsData = await missionsRes.json();

        state.stories = storiesData.stories || [];
        state.missions = missionsData.missions || [];

        console.log("Historias cargadas:", state.stories.length);
        console.log("Misiones cargadas:", state.missions.length);

        if (state.stories.length === 0 && state.missions.length === 0) {
            app.innerHTML = "<h2 style='color:red;'>Error: JSON files are empty or not found.</h2>";
        } else {
            render();
        }
    } catch (err) {
        console.error("FALLO DE INICIALIZACIÓN:", err);
        app.innerHTML = `
            <div style="color:white; background: #7f1d1d; padding: 20px; border-radius: 10px;">
                <h2>⚠️ Connection Error</h2>
                <p>The system could not load the knowledge base.</p>
                <p style="font-family: monospace; font-size: 12px;">${err.message}</p>
                <button onclick="location.reload()" style="background:white; color:black; padding:10px; margin-top:10px;">Retry</button>
            </div>
        `;
    }
});

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = state.lang === "en" ? "en-US" : "es-ES";
    window.speechSynthesis.speak(msg);
}

// 2. RENDERIZADO DEL SISTEMA DE BLOQUES
function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    // BIENVENIDA
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <input id="nameInput" type="text" placeholder="Full Name" autocomplete="off" />
            </div>
            <button class="primary" onclick="startApp()">PROCEED</button>
        `;
        return;
    }

    // NARRACIÓN DE HISTORIAS (UNA A LA VEZ)
    if (state.step === "story") {
        const s = state.stories[state.sIndex];
        if (!s) {
            state.step = "missions";
            state.mIndex = 0;
            render();
            return;
        }
        const text = state.lang === "en" ? s.en : s.es;
        speak(text);
        app.innerHTML = `
            <h3>${s.t || "Knowledge"}</h3>
            <div class="card"><p style="font-size:1.2em;">${text}</p></div>
            <button class="primary" onclick="nextStory()">CONTINUE</button>
            <p class="small">Story ${state.sIndex + 1} / ${state.stories.length}</p>
        `;
        return;
    }

    // MISIONES (SISTEMA DE BLOQUES)
    if (state.step === "missions") {
        const m = state.missions[state.mIndex];
        if (!m) {
            state.step = "complete";
            render();
            return;
        }

        const v = m.b.find(x => x.t === "v")?.tx || { en: "Mission", es: "Misión" };
        const s = m.b.find(x => x.story)?.story;
        const d = m.b.find(x => x.t === "d");

        const qText = state.lang === "en" ? d.q.en : d.q.es;
        const sText = s ? (state.lang === "en" ? s.en : s.es) : "";

        speak(sText || qText);

        app.innerHTML = `
            <h2 style="color:#facc15;">${state.lang === "en" ? v.en : v.es}</h2>
            <div class="card">
                ${sText ? `<p style="font-style:italic; opacity:0.8; border-bottom:1px solid #333; padding-bottom:10px;">"${sText}"</p>` : ""}
                <p style="font-weight:bold; margin-top:15px;">${qText}</p>
                <div id="answers">
                    ${d.op.map((opt, i) => `
                        <div class="answer" onclick="checkAnswer(${i}, ${d.c})">${opt}</div>
                    `).join("")}
                </div>
                <div id="feedback"></div>
            </div>
            <button class="primary" onclick="nextMission()">NEXT MISSION</button>
        `;
        return;
    }

    // CIERRE
    if (state.step === "complete") {
        app.innerHTML = `
            <h1>Training Complete</h1>
            <div class="circle"><span id="breathText">Breathe</span></div>
            <button class="primary" onclick="location.reload()">RESTART</button>
        `;
        startBreathing();
    }
}

/* CONTROLES */
function startApp() {
    const val = document.getElementById("nameInput").value;
    state.name = val || "User";
    state.step = "story";
    render();
}
function nextStory() { state.sIndex++; render(); }
function nextMission() { state.mIndex++; render(); }
function checkAnswer(idx, correct) {
    const fb = document.getElementById("feedback");
    fb.innerHTML = idx === correct ? 
        `<p style="color:#22c55e">CORRECT</p>` : 
        `<p style="color:#ef4444">REVISE PROTOCOL</p>`;
    speak(idx === correct ? "Correct" : "Try again");
}
function startBreathing() {
    let inh = true;
    setInterval(() => {
        const el = document.getElementById("breathText");
        if(el) { el.innerText = inh ? "Inhale" : "Exhale"; inh = !inh; }
    }, 4000);
}
