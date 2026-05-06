/* =============================================================
   KaMiZen ENGINE V3 - SEQUENTIAL PROTOCOL (Story 1 -> Mission 1)
   ============================================================= */

let state = {
    name: "",
    step: "welcome",
    lang: "en",
    currentIndex: 0, // Controla el par (Story X + Mission X)
    stories: [],
    missions: [],
    subStep: "story" // "story" o "mission"
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
        console.log("Data loaded: ", state.stories.length, "stories /", state.missions.length, "missions");
    } catch (e) {
        document.getElementById("app").innerHTML = "System Error: Check JSON files.";
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
            <button class="primary" onclick="startSystem()">INITIALIZE PROTOCOL</button>
        `;
        return;
    }

    // 2. PROCESO SECUENCIAL (UNA HISTORIA -> UNA MISIÓN)
    if (state.step === "training") {
        const currentStory = state.stories[state.currentIndex];
        const currentMission = state.missions[state.currentIndex];

        // Si ya no hay más contenido
        if (!currentStory && !currentMission) {
            state.step = "complete";
            render();
            return;
        }

        // SUB-PASO: MOSTRAR HISTORIA
        if (state.subStep === "story") {
            const text = state.lang === "en" ? currentStory.en : currentStory.es;
            speak(text);
            app.innerHTML = `
                <h3 style="color:#3b82f6;">KNOWLEDGE: ${currentStory.t}</h3>
                <div class="card"><p style="font-size:1.2em;">${text}</p></div>
                <button class="primary" onclick="toMission()">GO TO MISSION ${state.currentIndex + 1}</button>
            `;
        } 
        
        // SUB-PASO: MOSTRAR MISIÓN
        else if (state.subStep === "mission") {
            const v = currentMission.b.find(x => x.t === "v")?.tx;
            const s = currentMission.b.find(x => x.story)?.story;
            const d = currentMission.b.find(x => x.t === "d");

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
                <button class="primary" onclick="nextPair()">CONTINUE TO NEXT LEVEL</button>
            `;
        }
        return;
    }

    // 3. CIERRE
    if (state.step === "complete") {
        app.innerHTML = `
            <h1>Training Phase Complete</h1>
            <div class="circle"><span id="breathText">Inhale</span></div>
            <button class="primary" onclick="location.reload()">RESTART</button>
        `;
        startBreathing();
    }
}

/* --- LOGICA DE CONTROL --- */

function startSystem() {
    const val = document.getElementById("nameInput").value;
    state.name = val || "Explorer";
    state.step = "training";
    state.currentIndex = 0;
    state.subStep = "story";
    render();
}

function toMission() {
    state.subStep = "mission";
    render();
}

function nextPair() {
    state.currentIndex++;
    state.subStep = "story";
    render();
}

function checkAnswer(idx, correct) {
    const fb = document.getElementById("feedback");
    fb.innerHTML = idx === correct ? 
        `<p style="color:#22c55e; font-weight:bold;">CORRECT</p>` : 
        `<p style="color:#ef4444; font-weight:bold;">REVISE PROTOCOL</p>`;
    speak(idx === correct ? "Correct" : "Try again");
}

function startBreathing() {
    let inh = true;
    setInterval(() => {
        const el = document.getElementById("breathText");
        if(el) { el.innerText = inh ? "Inhale" : "Exhale"; inh = !inh; }
    }, 4000);
}
