/* =========================
   KaMiZen ENGINE V3 FIXED
   STATE MACHINE STABLE
========================= */

let state = {
    name: "",
    step: "welcome",

    stories: [],
    missions: [],

    sIndex: 0,
    mIndex: 0,

    initialized: false
};

/* =========================
   INIT SAFE LOAD
========================= */
window.addEventListener("load", async () => {
    await loadData();
    render();
});

/* =========================
   LOAD JSON SAFE
========================= */
async function loadData() {
    try {
        const storiesRes = await fetch("/stories.json");
        const missionsRes = await fetch("/missions.json");

        const storiesData = await storiesRes.json();
        const missionsData = await missionsRes.json();

        state.stories = storiesData.stories || storiesData;
        state.missions = missionsData.missions || missionsData;

        state.initialized = true;

        console.log("ENGINE READY:", {
            stories: state.stories.length,
            missions: state.missions.length
        });

    } catch (err) {
        console.error("LOAD ERROR:", err);
    }
}

/* =========================
   SPEECH (SAFE)
========================= */
function speak(text) {
    try {
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = "en-US";
        msg.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
    } catch (e) {
        console.warn("Speech error:", e);
    }
}

/* =========================
   MAIN RENDER
========================= */
function render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = "";

    /* =========================
       WELCOME
    ========================= */
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>Welcome to KaMiZen</h1>
            <p>Enter your name</p>

            <input id="nameInput" placeholder="Your name" />

            <br/><br/>

            <button onclick="startApp()">Start</button>
        `;
        return;
    }

    /* =========================
       NAME CONFIRM
    ========================= */
    if (state.step === "named") {
        app.innerHTML = `
            <h2>Hello ${state.name}</h2>
            <button onclick="startStories()">Begin Journey</button>
        `;
        return;
    }

    /* =========================
       STORIES ENGINE
    ========================= */
    if (state.step === "story") {

        const story = state.stories[state.sIndex];

        // 🔴 SAFETY CHECK (NO AUTO SKIP)
        if (!story) {
            console.log("Stories finished → switching to missions");
            state.step = "missions";
            render();
            return;
        }

        speak(story.en);

        app.innerHTML = `
            <h2>Story ${story.id}: ${story.t}</h2>

            <div class="card">
                <p>${story.en}</p>
            </div>

            <button onclick="nextStory()">Continue Story</button>

            <p class="small">Story ${state.sIndex + 1} / ${state.stories.length}</p>
        `;

        return;
    }

    /* =========================
       MISSIONS ENGINE
    ========================= */
    if (state.step === "missions") {

        const mission = state.missions[state.mIndex];

        // 🔴 STOP AUTO COMPLETE BUG
        if (!mission) {
            console.log("Missions finished → complete mode");
            state.step = "complete";
            render();
            return;
        }

        app.innerHTML = `
            <h2>Mission ${mission.id}</h2>

            <div class="card">
                <p>${mission.question || "No question loaded"}</p>

                <div id="answers">
                    ${(mission.answers || []).map((a, i) => `
                        <div class="answer" onclick="checkAnswer(${i}, ${mission.correct})">
                            ${a.text}
                        </div>
                    `).join("")}
                </div>

                <div id="feedback"></div>
            </div>

            <button onclick="nextMission()">Continue Mission</button>

            <p class="small">Mission ${state.mIndex + 1} / ${state.missions.length}</p>
        `;

        return;
    }

    /* =========================
       COMPLETE (BREATHING)
    ========================= */
    if (state.step === "complete") {

        app.innerHTML = `
            <h1>Training Complete</h1>

            <div class="circle" id="breathCircle">
                <span id="breathText">Inhale</span>
            </div>

            <p class="small">
                This exercise trains calm focus and nervous system control.
            </p>

            <button onclick="restart()">Restart</button>
        `;

        startBreathing();
        return;
    }
}

/* =========================
   FLOW CONTROLS
========================= */

function startApp() {
    const input = document.getElementById("nameInput");

    state.name = input?.value?.trim() || "User";

    state.step = "named";

    render();
}

function startStories() {
    if (!state.stories.length) {
        alert("Stories not loaded yet");
        return;
    }

    state.step = "story";
    state.sIndex = 0;

    render();
}

function nextStory() {
    state.sIndex++;

    if (state.sIndex >= state.stories.length) {
        state.step = "missions";
        state.mIndex = 0;
    }

    render();
}

function nextMission() {
    state.mIndex++;

    if (state.mIndex >= state.missions.length) {
        state.step = "complete";
    }

    render();
}

/* =========================
   ANSWER SYSTEM FIXED
========================= */
function checkAnswer(index, correct) {
    const fb = document.getElementById("feedback");
    if (!fb) return;

    if (index === correct) {
        fb.innerHTML = `<p style="color:green">Correct</p>`;
    } else {
        fb.innerHTML = `<p style="color:red">Incorrect</p>`;
    }
}

/* =========================
   BREATHING LOOP FIXED
========================= */
function startBreathing() {
    const text = document.getElementById("breathText");
    if (!text) return;

    let inhale = true;

    setInterval(() => {
        if (!document.getElementById("breathText")) return;

        text.innerText = inhale ? "Inhale" : "Exhale";
        inhale = !inhale;

    }, 3000);
}

/* =========================
   RESTART CLEAN
========================= */
function restart() {
    state.step = "welcome";
    state.sIndex = 0;
    state.mIndex = 0;
    state.name = "";

    render();
}
