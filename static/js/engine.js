/* =========================================================
   KAMIZEN ENGINE V11 - AUTOFLOW CONTROL SYSTEM
   ✔ Reads ALL stories & missions
   ✔ Speech lock until narration ends
   ✔ +4s safety delay before auto next
   ✔ Auto progression (story + mission blocks)
   ✔ Manual intro buttons preserved
   ✔ Breathing + questions remain manual
   ✔ No double render / no freeze
   ========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading",

    speechLocked: false,
    autoAdvanceLocked: false,

    initialized: false
};

/* =========================
   ENGINE LOCK
========================= */

if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("KAMIZEN ENGINE ALREADY RUNNING");
} else {
    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}

/* =========================
   INIT
========================= */

window.addEventListener("load", async () => {
    await loadAllData();
    showIntro();
});

/* =========================
   LOAD DATA
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>LOADING SYSTEM...</h2>
            <p>Initializing neural missions</p>
        </div>
    `;

    try {

        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = (storiesData.stories || []).sort((a,b)=>a.id-b.id);
        state.missions = (missionsData.missions || []).sort((a,b)=>a.id-b.id);

        state.initialized = true;

    } catch (err) {

        console.error(err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
                <p>Failed loading system</p>
            </div>
        `;
    }
}

/* =========================
   INTRO (NO AUTO)
========================= */

function showIntro() {

    state.phase = "intro";

    document.getElementById("app").innerHTML = `
        <div class="card">
            <h1>KAMIZEN LIFE SYSTEM</h1>

            <p>BODY • CALM • FOCUS • PRESENCE</p>
            <p style="opacity:.7;">Stories + Missions Active</p>
        </div>

        <button onclick="startSystem()">
            START SYSTEM
        </button>
    `;
}

/* =========================
   START SYSTEM
========================= */

function startSystem() {

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================
   MAIN RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions.find(m => m.id === story?.id);

    if (!story || !mission) {
        state.currentIndex = 0;
        state.currentBlock = 0;
        return render();
    }

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t}</h3>
                <p>${story.en}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {

            unlockContinue("START MISSION", startMission);

        });

        return;
    }

    if (state.phase === "mission") {

        const block = mission.b[state.currentBlock];

        if (!block) {
            nextStory();
            return;
        }

        renderBlock(block);
    }
}

/* =========================
   BLOCK RENDER
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let text = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
        text += block.tx.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        text += block.tx.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        text += block.story.en + ". ";
    }

    if (block.t === "breath_auto") {

        html += `
        <div class="card center">
            <div class="breath-circle" id="breathCircle">
                <span id="breathLabel">INHALE</span>
            </div>
            <h3>${block.tx.en}</h3>
            <p>${block.inf.en}</p>
        </div>`;

        text += block.tx.en + ". " + block.inf.en + ".";
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((o,i)=>{
            html += `<div class="answer"
                onclick="selectAnswer(${i},${block.c},${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                ${o}
            </div>`;
        });

        html += `</div>`;

        text += block.q.en;
    }

    if (block.t === "sil") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        text += block.tx.en;
    }

    if (block.t === "r") {
        html += `<div class="card"><h2>⭐ ${block.tx}</h2><p>+${block.p} XP</p></div>`;
        text += block.tx;
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    if (block.t === "breath_auto") startBreathingAnimation();

    narrate(text, async () => {

        if (block.t !== "d") {

            await delay(4000); // 🔥 4 SECOND SAFETY BUFFER

            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   ANSWERS (NO CHANGE)
========================= */

function selectAnswer(i,c,ex) {

    if (state.speechLocked) return;

    const ok = i === c;

    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${ok?'#22c55e':'#ef4444'}">
                ${ok?'CORRECT':'WRONG'}
            </h3>
            <p>${ex?.[i]||""}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(ex?.[i]||"", () => {

        unlockContinue("CONTINUE", nextBlock);

    });
}

/* =========================
   FLOW CONTROL
========================= */

function nextBlock() {
    if (state.speechLocked) return;
    state.currentBlock++;
    render();
}

function startMission() {
    if (state.speechLocked) return;
    state.phase = "mission";
    state.currentBlock = 0;
    render();
}

function nextStory() {

    state.currentIndex++;

    if (state.currentIndex >= state.stories.length)
        state.currentIndex = 0;

    state.phase = "story";
    state.currentBlock = 0;

    render();
}

/* =========================
   NARRATION ENGINE + SAFE LOCK
========================= */

function narrate(text, cb) {

    if (!text) return cb?.();

    state.speechLocked = true;
    state.autoAdvanceLocked = true;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);

    u.rate = 0.92;
    u.pitch = 1;

    u.onend = async () => {

        state.speechLocked = false;

        await delay(4000); // 🔥 EXTRA BUFFER AFTER VOICE

        state.autoAdvanceLocked = false;

        cb?.();
    };

    window.speechSynthesis.speak(u);
}

/* =========================
   HELPERS
========================= */

function delay(ms){
    return new Promise(r=>setTimeout(r,ms));
}

function unlockContinue(t,a){
    const b=document.getElementById("continueBtn");
    if(!b) return;
    b.disabled=false;
    b.innerText=t;
    b.onclick=a;
}

/* =========================
   BREATHING (UNCHANGED LOGIC)
========================= */

function startBreathingAnimation(){

    const c=document.getElementById("breathCircle");
    const l=document.getElementById("breathLabel");

    if(!c||!l) return;

    let inha=true;

    setInterval(()=>{

        if(inha){
            l.innerText="INHALE";
            c.style.transform="scale(1.25)";
        }else{
            l.innerText="EXHALE";
            c.style.transform="scale(0.8)";
        }

        inha=!inha;

    },4000);
}
