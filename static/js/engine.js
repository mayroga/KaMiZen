/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V7 (STABLE CORE SYSTEM)
   Flow: Story(N) → Mission(N) → Auto Next
   System: Cognitive Training + Decision Layer + Breath Control
   ============================================================= */

let state = {
    name: "",
    step: "welcome",
    index: 0,
    bIndex: 0,
    subStep: "story",
    stories: [],
    missions: [],
    initialized: false,
    breathingActive: false
};

window.addEventListener("load", async () => {
    await loadData();
    render();
});

/* =========================
   DATA LOADING
========================= */

async function loadData() {
    try {
        const [sRes, mRes] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const sData = await sRes.json();
        const mData = await mRes.json();

        state.stories = (sData.stories || []).sort((a, b) => a.id - b.id);
        state.missions = (mData.missions || []).sort((a, b) => a.id - b.id);

        state.initialized = true;
    } catch (err) {
        console.error("ENGINE ERROR: DATA OFFLINE", err);
    }
}

/* =========================
   SPEECH SYSTEM
========================= */

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    msg.rate = 1;

    window.speechSynthesis.speak(msg);
}

/* =========================
   MAIN RENDER
========================= */

function render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = "";

    /* ---------- WELCOME ---------- */
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <div class="card">
                <p>Enter your identity to begin training</p>
                <input id="nameInput" type="text" placeholder="Your Name"/>
            </div>
            <button class="primary" onclick="startApp()">START SYSTEM</button>
        `;
        return;
    }

    /* ---------- TRAINING ---------- */
    if (state.step === "training") {

        const story = state.stories[state.index];
        const mission = state.missions[state.index];

        if (!story && !mission) {
            app.innerHTML = `
                <h1>TRAINING COMPLETE</h1>
                <button class="primary" onclick="location.reload()">RESTART SYSTEM</button>
            `;
            return;
        }

        /* STORY MODE */
        if (state.subStep === "story") {
            app.innerHTML = `
                <div class="card">
                    <h3>STORY ${story?.id ?? state.index}</h3>
                    <p>${story?.en ?? "No story loaded"}</p>
                </div>
                <button class="primary" onclick="startMission()">ENTER MISSION</button>
            `;

            if (story?.en) speak(story.en);
            return;
        }

        /* MISSION MODE */
        if (state.subStep === "blocks") {
            const block = mission?.b?.[state.bIndex];
            if (!block) return nextMission();

            renderBlock(block, mission.b.length);
        }
    }
}

/* =========================
   BLOCK ENGINE
========================= */

function renderBlock(block, total) {
    const app = document.getElementById("app");
    let html = "";

    const t = block.t;

    switch (t) {

        case "v":
            html = `<h2>${block.tx.en}</h2>`;
            speak(block.tx.en);
            break;

        case "h":
            html = `<div class="card"><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;

        case "story":
            html = `<div class="card"><p>${block.story.en}</p></div>`;
            speak(block.story.en);
            break;

        case "d":
            html = `
                <div class="card">
                    <p>${block.q.en}</p>
                    ${block.op.map((o, i) => `
                        <div class="answer" onclick="handleDecision(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                            ${o}
                        </div>
                    `).join("")}
                    <div id="feedback"></div>
                </div>
            `;
            speak(block.q.en);
            app.innerHTML = html;
            return;

        case "sil":
            html = `
                <div class="card">
                    <h3>${block.tx.en}</h3>
                    <p>${block.inf.en}</p>
                </div>
            `;
            break;

        /* =========================
           BREATH AUTO SYSTEM (FIXED)
        ========================= */

        case "breath_auto":
            html = `
                <div class="card" style="text-align:center;">
                    <div id="circle" class="circle">FOCUS</div>
                    <p>${block.tx.en || block.inf.en}</p>
                </div>
            `;
            app.innerHTML = html;
            startBreathing(block.d || 30);
            return;

        case "r":
            html = `<div class="card">⭐ REWARD +${block.p}</div>`;
            break;

        case "c":
            html = `<div class="card">${block.tx.en}</div>`;
            speak(block.tx.en);
            break;
    }

    app.innerHTML = html + `
        <button class="primary" onclick="nextBlock()">CONTINUE</button>
    `;
}

/* =========================
   FLOW CONTROL
========================= */

function startApp() {
    const val = document.getElementById("nameInput").value;
    if (!val) return;

    state.name = val;
    state.step = "training";
    state.subStep = "story";

    render();
}

function startMission() {
    state.subStep = "blocks";
    state.bIndex = 0;
    render();
}

function nextBlock() {
    const mission = state.missions[state.index];

    if (!mission) return nextMission();

    if (state.bIndex < mission.b.length - 1) {
        state.bIndex++;
    } else {
        nextMission();
        return;
    }

    render();
}

function nextMission() {
    state.index++;
    state.bIndex = 0;
    state.subStep = "story";
    render();
}

/* =========================
   DECISION SYSTEM
========================= */

function handleDecision(i, correct, explanations) {
    const fb = document.getElementById("feedback");
    const ok = i === correct;

    fb.innerHTML = `
        <div class="${ok ? 'success' : 'error'}">
            <p>${ok ? "CORRECT" : "WRONG"}</p>
            <span>${explanations[i]}</span>
        </div>
        <button class="primary" onclick="nextBlock()">CONTINUE</button>
    `;

    speak(explanations[i]);
}

/* =========================
   BREATHING SYSTEM (STABLE)
========================= */

function startBreathing(seconds) {
    if (state.breathingActive) return;
    state.breathingActive = true;

    const circle = document.getElementById("circle");
    if (!circle) return;

    let inhale = true;
    let time = seconds;

    function cycle() {
        if (!document.getElementById("circle")) return;

        circle.style.transition = "transform 3s ease-in-out";

        if (inhale) {
            circle.innerText = "INHALE";
            circle.style.transform = "scale(1.3)";
            speak("Inhale");
        } else {
            circle.innerText = "EXHALE";
            circle.style.transform = "scale(0.8)";
            speak("Exhale");
        }

        inhale = !inhale;
    }

    cycle();

    const interval = setInterval(() => {

        cycle();

        time -= 3;

        if (time <= 0) {
            clearInterval(interval);
            state.breathingActive = false;

            document.getElementById("app").innerHTML += `
                <button class="primary" onclick="nextBlock()">COMPLETE</button>
            `;
        }

    }, 3000);
}
