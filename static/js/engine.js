/* =========================================================
   KAMIZEN ENGINE V8 - DATA SAFE + FULL BLOCK SUPPORT
========================================================= */

let state = {
    stories: [],
    missions: [],
    index: 0,
    step: "story",
    bIndex: 0,
    ready: false
};

/* =========================
   LOAD DATA
========================= */

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const sd = await s.json();
    const md = await m.json();

    state.stories = (sd.stories || []).sort((a,b)=>a.id-b.id);

    // 🔥 FIX: missions may be object or array
    state.missions = (md.missions || md || []).sort((a,b)=>a.id-b.id);

    state.ready = true;
}

/* =========================
   RENDER CORE
========================= */

function render() {
    const app = document.getElementById("app");
    if (!app) return;

    if (!state.ready) {
        app.innerHTML = "Loading...";
        return;
    }

    const story = state.stories[state.index];
    const mission = state.missions[state.index];

    if (!story || !mission) {
        state.index = 0;
        state.bIndex = 0;
        state.step = "story";
        return render();
    }

    if (state.step === "story") {
        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
            </div>
            <button onclick="startMission()">START</button>
        `;
        speak(story.en);
        return;
    }

    const block = mission.b[state.bIndex];

    if (!block) {
        nextStory();
        return;
    }

    renderBlock(block);
}

/* =========================
   BLOCK ENGINE (FIXED)
========================= */

function renderBlock(b) {
    const app = document.getElementById("app");
    let html = "";

    const text = b.tx?.en || b.story?.en || b.inf?.en || "";

    if (b.t === "v") html += `<div class="card"><h2>${text}</h2></div>`;

    if (b.t === "h") html += `<div class="card"><p>${text}</p></div>`;

    if (b.story) html += `<div class="card"><p>${b.story.en}</p></div>`;

    /* 🔥 BREATHING FIX (inf ahora SIEMPRE visible) */
    if (b.t === "breath_auto" || b.t === "br") {
        html += `
        <div class="card">
            <div class="breath-circle">FOCUS</div>
            <p>${b.tx?.en || ""}</p>
            <p style="color:#94a3b8;font-size:12px">
                ${b.inf?.en || ""}
            </p>
        </div>`;
    }

    if (b.t === "sil") {
        html += `
        <div class="card">
            <h3>${b.tx?.en}</h3>
            <p>${b.inf?.en || ""}</p>
        </div>`;
    }

    if (b.t === "d") {
        html += `<div class="card"><p>${b.q.en}</p>`;

        b.op.forEach((opt,i)=>{
            html += `
            <div class="answer" onclick="answer(${i},${b.c},${JSON.stringify(b.ex).replace(/"/g,'&quot;')})">
                ${opt}
            </div>`;
        });

        html += `</div>`;
    }

    if (b.t === "r") html += `<div class="card">⭐ +${b.p} XP</div>`;

    if (b.t === "c") html += `<div class="card">${text}</div>`;

    html += `<button onclick="nextBlock()">CONTINUE</button>`;

    app.innerHTML = html;
}

/* =========================
   FLOW CONTROL
========================= */

function startMission(){
    state.step="mission";
    state.bIndex=0;
    render();
}

function nextBlock(){
    state.bIndex++;
    render();
}

function nextStory(){
    state.index++;
    if(state.index>=state.stories.length){
        state.index=0;
    }
    state.step="story";
    state.bIndex=0;
    render();
}

/* =========================
   SPEECH
========================= */

function speak(t){
    if(!t) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang="en-US";
    window.speechSynthesis.speak(u);
}
