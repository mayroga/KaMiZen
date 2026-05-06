/* =========================================================
   KAMIZEN ENGINE V8 FIX - FULL STABILITY + AUDIO QUEUE
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    index: 0,
    step: "story",
    bIndex: 0,
    ready: false,
    speaking: false
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

        state.stories = (sd.stories || []).sort((a, b) => a.id - b.id);

        // 🔥 FIX: missions vienen dentro de objeto
        state.missions = (md.missions || []).sort((a, b) => a.id - b.id);

        state.ready = true;

    } catch (err) {
        console.error("LOAD ERROR", err);
    }
}

/* =========================
   SAFE SPEECH QUEUE (CRITICAL FIX)
========================= */

function speak(text, callback) {
    if (!text) {
        if (callback) callback();
        return;
    }

    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";

    state.speaking = true;

    msg.onend = () => {
        state.speaking = false;
        if (callback) callback();
    };

    window.speechSynthesis.speak(msg);
}

/* =========================
   RENDER CORE
========================= */

function render() {
    const app = document.getElementById("app");
    if (!app || !state.ready) {
        if (app) app.innerHTML = "<h3>Loading...</h3>";
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

    /* =========================
       STORY MODE
    ========================= */

    if (state.step === "story") {
        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
            </div>
            <button onclick="startMission()">START MISSION</button>
        `;

        speak(story.en);
        return;
    }

    /* =========================
       MISSION MODE
    ========================= */

    const block = mission.b[state.bIndex];

    if (!block) {
        nextStory();
        return;
    }

    renderBlock(block);
}

/* =========================
   BLOCK ENGINE (FULL FIX INF + BREATH)
========================= */

function renderBlock(b) {
    const app = document.getElementById("app");
    let html = "";

    /* VISUAL */
    if (b.t === "v") {
        html += `<div class="card"><h2>${b.tx.en}</h2></div>`;
    }

    /* HEADER */
    if (b.t === "h") {
        html += `<div class="card"><p>${b.tx.en}</p></div>`;
    }

    /* STORY INSIDE MISSION */
    if (b.story) {
        html += `<div class="card"><p>${b.story.en}</p></div>`;
    }

    /* BREATHING FIXED (TX + INF + FULL SPEAK) */
    if (b.t === "breath_auto" || b.t === "br") {
        html += `
        <div class="card">
            <div class="breath-circle">FOCUS</div>
            <p>${b.tx?.en || ""}</p>
            <small>${b.inf?.en || ""}</small>
        </div>`;

        app.innerHTML = html;

        return speak(
            `${b.tx?.en || ""}. ${b.inf?.en || ""}`,
            () => nextBlock()
        );
    }

    /* QUESTION */
    if (b.t === "d") {
        html += `<div class="card"><p>${b.q.en}</p>`;

        b.op.forEach((opt, i) => {
            html += `<div class="answer" onclick="answer(${i},${b.c},${JSON.stringify(b.ex).replace(/"/g,'&quot;')})">${opt}</div>`;
        });

        html += `</div>`;
    }

    /* SILENCE FIXED */
    if (b.t === "sil") {
        html += `
        <div class="card">
            <h3>${b.tx.en}</h3>
            <p>${b.inf?.en || ""}</p>
        </div>`;

        app.innerHTML = html;

        return speak(
            `${b.tx.en}. ${b.inf?.en || ""}`,
            () => nextBlock()
        );
    }

    /* REWARD */
    if (b.t === "r") {
        html += `<div class="card">⭐ +${b.p} XP</div>`;
    }

    /* CONCLUSION */
    if (b.t === "c") {
        html += `<div class="card">${b.tx.en}</div>`;

        app.innerHTML = html;

        return speak(b.tx.en, () => nextBlock());
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
    state.bIndex++;
    render();
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
   ANSWERS
========================= */

function answer(i, correct, exp) {
    const app = document.getElementById("app");

    const ok = i === correct;

    app.innerHTML += `
        <div class="card" style="color:${ok ? '#22c55e' : '#ef4444'}">
            ${ok ? "CORRECT" : "WRONG"}<br>
            ${exp?.[i] || ""}
        </div>
        <button onclick="nextBlock()">CONTINUE</button>
    `;

    speak(exp?.[i]);
}
