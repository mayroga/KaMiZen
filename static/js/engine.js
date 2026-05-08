/* =========================================================
   KAMIZEN ENGINE V11 - AUTO FLOW + CONTROLLED PRESENCE
   ✔ Reads ALL 49 stories/missions
   ✔ Speech lock + 4s delay after voice
   ✔ Auto progression system
   ✔ Manual control only where needed
   ✔ Breath + Q/A remain interactive
   ✔ Start / End control buttons
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
    initialized: false,

    autoMode: true
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

        state.stories = storiesData.stories.sort((a,b)=>a.id-b.id);
        state.missions = missionsData.missions.sort((a,b)=>a.id-b.id);

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
   INTRO
========================= */

function showIntro() {

    state.phase = "intro";

    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>

            <p>BODY • CALM • FOCUS • PRESENCE</p>

            <p class="small">Stories + Missions Active</p>
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
    state.phase = "story";
    state.currentIndex = 0;
    state.currentBlock = 0;
    render();
}

/* =========================
   MAIN RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const story = state.stories[state.currentIndex];
    const mission = state.missions.find(m => m.id === story.id);

    if (!story || !mission) {
        state.currentIndex = 0;
        return render();
    }

    if (state.phase === "story") {
        renderStory(story);
        return;
    }

    if (state.phase === "mission") {
        const block = mission.b[state.currentBlock];
        if (!block) return endBlock();
        renderBlock(block);
    }
}

/* =========================
   STORY (AUTO AFTER VOICE)
========================= */

function renderStory(story) {

    document.getElementById("app").innerHTML = `
        <div class="card">
            <h2>STORY ${story.id}</h2>
            <h3>${story.t}</h3>
            <p>${story.en}</p>
        </div>

        <button id="continueBtn" disabled>STARTING...</button>
    `;

    narrate(`${story.t}. ${story.en}`, () => {

        setTimeout(() => {
            state.phase = "mission";
            state.currentBlock = 0;
            render();
        }, 4000);

    });
}

/* =========================
   MISSION BLOCK
========================= */

function renderBlock(block) {

    let html = "";
    let text = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
        text += block.tx.en;
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        text += block.tx.en;
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        text += block.story.en;
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

        text += block.tx.en + block.inf.en;
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((o,i)=>{
            html += `<div class="answer" onclick="selectAnswer(${i},${block.c},${JSON.stringify(block.ex)})">${o}</div>`;
        });

        html += `</div>`;
    }

    if (block.t === "r") {
        html += `<div class="card"><h2>⭐ ${block.tx}</h2><p>+${block.p} XP</p></div>`;
        text += block.tx;
    }

    document.getElementById("app").innerHTML = html;

    if (block.t === "breath_auto") startBreathingAnimation();

    narrate(text, () => {

        if (block.t !== "d") {
            setTimeout(nextBlock, 4000); // 🔥 AUTO DELAY AFTER VOICE
        }
    });
}

/* =========================
   ANSWERS (MANUAL ONLY)
========================= */

function selectAnswer(i,c,ex) {

    const ok = i === c;

    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${ok?'#22c55e':'#ef4444'}">
                ${ok?'CORRECT':'WRONG'}
            </h3>
            <p>${ex[i]}</p>
        </div>

        <button onclick="nextBlock()">CONTINUE</button>
        <button onclick="restart()">RESTART</button>
    `;
}

/* =========================
   BLOCK CONTROL
========================= */

function nextBlock() {
    state.currentBlock++;
    render();
}

function endBlock() {

    document.getElementById("app").innerHTML += `
        <div class="card">
            <button onclick="nextStory()">CONTINUE</button>
            <button onclick="skipStory()">SKIP</button>
            <button onclick="restart()">RESTART</button>
        </div>
    `;
}

function nextStory() {
    state.currentIndex++;
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

function skipStory() {
    nextStory();
}

function restart() {
    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";
    render();
}

/* =========================
   SPEECH + DELAY SYSTEM
========================= */

function narrate(text, cb) {

    state.speechLocked = true;

    const s = new SpeechSynthesisUtterance(text);

    s.rate = 0.92;

    s.onend = () => {
        state.speechLocked = false;
        cb && cb();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(s);
}

/* =========================
   BREATHING
========================= */

function startBreathingAnimation() {

    const c = document.getElementById("breathCircle");
    const l = document.getElementById("breathLabel");

    if (!c) return;

    let i = true;

    setInterval(()=>{
        if(i){
            l.innerText="INHALE";
            c.style.transform="scale(1.25)";
        }else{
            l.innerText="EXHALE";
            c.style.transform="scale(0.8)";
        }
        i=!i;
    },4000);
}
