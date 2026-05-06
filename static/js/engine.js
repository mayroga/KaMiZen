/* =============================================================
   KaMiZen ENGINE V3 - BLOCK ARCHITECTURE (STRICT)
   ============================================================= */

let state = {
    name: "",
    step: "welcome",
    lang: "en", // "en" o "es"
    stories: [],
    missions: [],
    sIndex: 0,
    mIndex: 0,
    initialized: false
};

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    try {
        const storiesRes = await fetch("/api/stories");
        const missionsRes = await fetch("/api/missions");
        
        const storiesData = await storiesRes.json();
        const missionsData = await missionsRes.json();

        state.stories = storiesData.stories || [];
        state.missions = missionsData.missions || [];
        state.initialized = true;

        console.log("SYSTEM READY", { 
            stories: state.stories.length, 
            missions: state.missions.length 
        });
    } catch (err) {
        console.error("CRITICAL LOAD ERROR:", err);
    }
}

function speak(text) {
    if (!text) return;
    try {
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.lang === "en" ? "en-US" : "es-ES";
        msg.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
    } catch (e) { console.warn(e); }
}

function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    // 1. WELCOME
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <p>Enter your full name to begin</p>
            input id="nameInput" type="text" placeholder="Your Name" />
            <br/><br/>
            <button class="primary" onclick="startApp()">START</button>
        `;
        return;
    }

    // 2. NAMED
    if (state.step === "named") {
        app.innerHTML = `
            <h2>Protocol: ${state.name}</h2>
            <button class="primary" onclick="startStories()">BEGIN JOURNEY</button>
        `;
        return;
    }

    // 3. STORIES ENGINE (ONE BY ONE)
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
            <h3>${s.t}</h3>
            <div class="card">
                <p style="font-size:1.2em;">${text}</p>
            </div>
            <button class="primary" onclick="nextStory()">CONTINUE</button>
            <p class="small">Story ${state.sIndex + 1} / ${state.stories.length}</p>
        `;
        return;
    }

    // 4. MISSIONS ENGINE (BLOCK SYSTEM)
    if (state.step === "missions") {
        const m = state.missions[state.mIndex];
        if (!m) {
            state.step = "complete";
            render();
            return;
        }

        // --- BUSCAR BLOQUES ESPECÍFICOS ---
        const vBlock = m.b.find(x => x.t === "v"); // Title
        const hBlock = m.b.find(x => x.t === "h"); // Hint
        const sBlock = m.b.find(x => x.story);    // Internal Story
        const dBlock = m.b.find(x => x.t === "d"); // Decision/Question

        const title = vBlock ? (state.lang === "en" ? vBlock.tx.en : vBlock.tx.es) : "Mission";
        const hint = hBlock ? (state.lang === "en" ? hBlock.tx.en : hBlock.tx.es) : "";
        const story = sBlock ? (state.lang === "en" ? sBlock.story.en : sBlock.story.es) : "";
        
        const question = dBlock ? (state.lang === "en" ? dBlock.q.en : dBlock.q.es) : "No question";
        const options = dBlock ? dBlock.op : [];
        const correctIdx = dBlock ? dBlock.c : 0;

        speak(story || question);

        app.innerHTML = `
            <h2 style="color:#facc15;">${title}</h2>
            <p class="small">${hint}</p>
            
            <div class="card">
                ${story ? `<p style="font-style:italic; border-bottom:1px solid #333; padding-bottom:10px;">"${story}"</p>` : ""}
                <p style="font-weight:bold; font-size:1.1em; margin-top:15px;">${question}</p>
                
                <div id="answers">
                    ${options.map((opt, i) => `
                        <div class="answer" onclick="checkAnswer(${i}, ${</correctIdx})">
                            ${opt}
                        </div>
                    `).join("")}
                </div>
                <div id="feedback"></div>
            </div>

            <button class="primary" onclick="nextMission()">NEXT MISSION</button>
            <p class="small">Mission ${state.mIndex + 1} / ${state.missions.length}</p>
        `;
        return;
    }

    // 5. COMPLETE
    if (state.step === "complete") {
        app.innerHTML = `
            <h1>Training Complete</h1>
            <div class="circle" id="breathCircle">
                <span id="breathText">Inhale</span>
            </div>
            <button class="primary" onclick="location.reload()">RESTART</button>
        `;
        startBreathing();
        return;
    }
}

/* --- LOGIC --- */

function startApp() {
    const input = document.getElementById("nameInput");
    state.name = input?.value || "Explorer";
    state.step = "named";
    render();
}

function startStories() {
    state.step = "story";
    state.sIndex = 0;
    render();
}

function nextStory() {
    state.sIndex++;
    render();
}

function nextMission() {
    state.mIndex++;
    render();
}

function checkAnswer(idx, correct) {
    const fb = document.getElementById("feedback");
    if (idx === correct) {
        fb.innerHTML = `<p style="color:#22c55e">✓ CORRECT</p>`;
        speak("Correct");
    } else {
        fb.innerHTML = `<p style="color:#ef4444">✗ REVISE</p>`;
        speak("Observe again");
    }
}

function startBreathing() {
    let inhale = true;
    setInterval(() => {
        const text = document.getElementById("breathText");
        if (!text) return;
        text.innerText = inhale ? "Inhale" : "Exhale";
        inhale = !inhale;
    }, 4000);
}
