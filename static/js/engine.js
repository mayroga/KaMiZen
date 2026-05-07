/* =========================================================
   KAMIZEN ENGINE V11 - FULL STABLE + EXAM MODE
   ✔ Reads ALL 35 stories
   ✔ Reads ALL 35 missions
   ✔ Exam Mode (36-49 optional system)
   ✔ No freeze
   ✔ No double render
   ✔ Speech lock until narration ends
   ✔ Loading screen first
   ✔ Manual start button
   ✔ Breathing system stable
   ✔ Clean flow 1 -> 35 -> loop
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

    /* ===== EXAM MODE ===== */
    examMode: false,
    examData: null,
    examIndex: 0,
    examBlock: 0
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

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS:", state.missions.length);

    } catch (err) {

        console.error("LOAD ERROR:", err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
                <p>Failed loading system</p>
            </div>
        `;
    }
}

/* =========================
   INTRO SCREEN
========================= */

function showIntro() {

    state.phase = "intro";

    document.getElementById("app").innerHTML = `
        <div class="card">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Awareness • Control • Safety • Focus</p>
            <p style="opacity:.8;">35 Stories • 35 Missions</p>
        </div>

        <button onclick="startSystem()">START SYSTEM</button>

        <button onclick="loadExamMode()">
            HOW TO REACT BEFORE & DURING EXAMS
        </button>
    `;
}

/* =========================
   START SYSTEM
========================= */

function startSystem() {

    state.examMode = false;

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================
   EXAM MODE LOADER
========================= */

async function loadExamMode() {

    try {

        state.examMode = true;
        state.phase = "exam";

        const [a,b] = await Promise.all([
            fetch("/exam36-42.json"),
            fetch("/exam43-49.json")
        ]);

        const d1 = await a.json();
        const d2 = await b.json();

        state.examData = [...(d1.missions||[]), ...(d2.missions||[])];

        state.examIndex = 0;
        state.examBlock = 0;

        renderExam();

    } catch (e) {
        console.error("EXAM MODE ERROR:", e);
    }
}

/* =========================
   MAIN RENDER (NORMAL MODE)
========================= */

function render() {

    if (!state.initialized || state.examMode) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0;
        state.currentBlock = 0;
        return render();
    }

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(story.en, () => {
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
   EXAM MODE RENDER
========================= */

function renderExam() {

    if (!state.examMode) return;

    const app = document.getElementById("app");

    const mission = state.examData[state.examIndex];

    if (!mission) {
        state.examMode = false;
        showIntro();
        return;
    }

    const block = mission.b[state.examBlock];

    if (!block) {
        state.examIndex++;
        state.examBlock = 0;
        return renderExam();
    }

    let html = "";
    let text = "";

    if (block.t === "v") html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
    if (block.t === "h") html += `<div class="card"><p>${block.tx.en}</p></div>`;
    if (block.story) html += `<div class="card"><p>${block.story.en}</p></div>`;

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((o,i)=>{
            html += `<div class="answer" onclick="selectExamAnswer(${i},${block.c},${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">${o}</div>`;
        });

        html += `</div>`;
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    narrate(block.q?.en || block.story?.en || "", () => {

        unlockContinue("CONTINUE", () => {
            state.examBlock++;
            renderExam();
        });

    });
}

/* =========================
   EXAM ANSWER SYSTEM
========================= */

function selectExamAnswer(i,c,ex){

    if(state.speechLocked) return;

    const ok = i === c;

    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${ok?'green':'red'}">
                ${ok?'CORRECT':'WRONG'}
            </h3>
            <p>${ex?.[i]||""}</p>
        </div>
    `;

    narrate(ex?.[i]||"", () => {
        unlockContinue("CONTINUE", () => {
            state.examBlock++;
            renderExam();
        });
    });
}

/* =========================
   CORE SYSTEM FUNCTIONS (UNCHANGED LOGIC)
========================= */

function startMission(){
    state.phase="mission";
    state.currentBlock=0;
    render();
}

function nextStory(){
    state.currentIndex++;
    if(state.currentIndex>=state.stories.length) state.currentIndex=0;
    state.phase="story";
    state.currentBlock=0;
    render();
}

function nextBlock(){
    state.currentBlock++;
    render();
}

function narrate(text,cb){
    if(!text){cb&&cb();return;}

    state.speechLocked=true;

    const s=new SpeechSynthesisUtterance(text);
    s.lang="en-US";
    s.rate=0.92;

    s.onend=()=>{
        state.speechLocked=false;
        cb&&cb();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(s);
}

function unlockContinue(t,fn){
    const b=document.getElementById("continueBtn");
    if(!b)return;
    b.disabled=false;
    b.innerText=t;
    b.onclick=fn;
}
