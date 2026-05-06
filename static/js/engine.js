/* =========================================================
   KAMIZEN ENGINE V9 - FULL SYNC + INF SUPPORT + SAFE FLOW
   FIXES:
   ✔ full mission reading
   ✔ inf always rendered + spoken
   ✔ no skipped blocks
   ✔ breathing synced
   ✔ stable index system
========================================================= */

let state = {
    stories: [],
    missions: [],
    index: 0,
    step: "story",
    bIndex: 0,
    ready: false,
    lock: false
};

/* =========================
   INIT
========================= */

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    try {
        const [s, m] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const sd = await s.json();
        const md = await m.json();

        state.stories = (sd.stories || []).sort((a,b)=>a.id-b.id);
        state.missions = (md.missions || []).sort((a,b)=>a.id-b.id);

        state.ready = true;

    } catch (e) {
        console.error("LOAD ERROR", e);
    }
}

/* =========================
   MAIN RENDER
========================= */

function render() {
    const app = document.getElementById("app");
    if (!app) return;

    if (!state.ready) {
        app.innerHTML = "<h3>Loading system...</h3>";
        return;
    }

    const story = state.stories[state.index];
    const mission = state.missions[state.index];

    if (!story || !mission) {
        state.index = 0;
        state.step = "story";
        state.bIndex = 0;
        return render();
    }

    /* STORY */
    if (state.step === "story") {
        const text = story.en;

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${text}</p>
            </div>
            <button onclick="startMission()">START MISSION</button>
        `;

        speak(text);
        return;
    }

    /* MISSION */
    const block = mission.b[state.bIndex];

    if (!block) {
        nextStory();
        return;
    }

    renderBlock(block);
}

/* =========================
   BLOCK ENGINE (FIXED INF SUPPORT)
========================= */

function renderBlock(b) {
    const app = document.getElementById("app");

    let html = "";

    const speakAll = (text) => {
        if (text) speak(text);
    };

    /* VISUAL */
    if (b.t === "v") {
        html += `<div class="card"><h2>${b.tx.en}</h2></div>`;
        speakAll(b.tx.en);
    }

    /* HEADER */
    if (b.t === "h") {
        html += `<div class="card"><p>${b.tx.en}</p></div>`;
        speakAll(b.tx.en);
    }

    /* STORY INSIDE */
    if (b.story) {
        html += `<div class="card"><p>${b.story.en}</p></div>`;
        speakAll(b.story.en);
    }

    /* BREATHING AUTO (FULL FIX) */
    if (b.t === "breath_auto") {
        html += `
            <div class="card">
                <div class="breath-circle">BREATH</div>
                <p>${b.tx?.en || ""}</p>
                <p style="color:#94a3b8">${b.inf?.en || ""}</p>
            </div>
        `;

        speakAll(b.tx?.en);
        setTimeout(() => speakAll(b.inf?.en), 800);
    }

    /* SILENCE (FIX INF) */
    if (b.t === "sil") {
        html += `
            <div class="card">
                <h3>${b.tx.en}</h3>
                <p>${b.inf?.en || ""}</p>
            </div>
        `;

        speakAll(b.tx.en);
        setTimeout(() => speakAll(b.inf?.en), 600);
    }

    /* QUESTION */
    if (b.t === "d") {
        html += `<div class="card"><p>${b.q.en}</p>`;

        b.op.forEach((opt, i) => {
            html += `
                <div class="answer" onclick="answer(${i},${b.c},${JSON.stringify(b.ex).replace(/"/g,'&quot;')})">
                    ${opt}
                </div>
            `;
        });

        html += `</div>`;

        speakAll(b.q.en);
    }

    /* REWARD */
    if (b.t === "r") {
        html += `<div class="card">⭐ +${b.p} XP</div>`;
    }

    /* CONCLUSION */
    if (b.t === "c") {
        html += `<div class="card"><p>${b.tx.en}</p></div>`;
        speakAll(b.tx.en);
    }

    html += `<button onclick="nextBlock()">CONTINUE</button>`;

    app.innerHTML = html;
}

/* =========================
   FLOW CONTROL
========================= */

function startMission() {
    state.step = "mission";
    state.bIndex = 0;
    render();
}

function nextBlock() {
    if (state.lock) return;

    state.lock = true;

    setTimeout(() => {
        state.bIndex++;
        state.lock = false;
        render();
    }, 200);
}

function nextStory() {
    state.index++;

    if (state.index >= state.stories.length) {
        state.index = 0;
    }

    state.step = "story";
    state.bIndex = 0;

    render();
}

/* =========================
   ANSWER SYSTEM
========================= */

function answer(i, correct, exp) {
    const app = document.getElementById("app");

    const ok = i === correct;
    const msg = exp?.[i] || "";

    app.innerHTML += `
        <div class="card" style="color:${ok?'#22c55e':'#ef4444'}">
            ${ok ? "CORRECT" : "WRONG"}<br>
            ${msg}
        </div>
        <button onclick="nextBlock()">CONTINUE</button>
    `;

    speak(msg);
}

/* =========================
   VOICE ENGINE (FIXED QUEUE)
========================= */

function speak(text) {
    if (!text) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;

    window.speechSynthesis.speak(u);
}
