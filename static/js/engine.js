/* =========================================================
   KAMIZEN ENGINE V11 - BACKEND SYNC FIXED
   ✔ Compatible with YOUR MAIN.PY (title/header/story/options/interactive_blocks)
   ✔ No freeze
   ✔ No double render
   ✔ Breath circle floating (DOES NOT block UI)
   ✔ Smooth inhale/exhale animation (inflate/deflate)
   ========================================================= */

/* =========================
   STATE
========================= */

let state = {
    mission: null,
    locked: false,
    lang: "en",
    breathingActive: false
};

/* =========================
   INIT
========================= */

window.addEventListener("load", () => {
    loadMission();
    startTimerSync();
});

/* =========================
   LOAD MISSION
========================= */

async function loadMission() {

    try {

        const res = await fetch("/api/mission/next?lang=" + state.lang);
        const data = await res.json();

        if (data.end) {
            document.body.innerHTML = `
                <div style="color:white;text-align:center;padding:50px;">
                    SESSION COMPLETE
                </div>
            `;
            return;
        }

        state.mission = data;
        renderMission(data);

    } catch (err) {
        console.log("BACKEND ERROR", err);
        setTimeout(loadMission, 1500);
    }
}

/* =========================
   RENDER MISSION
========================= */

function renderMission(data) {

    const app = document.getElementById("app") || createApp();

    let html = "";

    html += `
        <div class="card">
            <h2>${data.title || ""}</h2>
            <h3>${data.header || ""}</h3>
            <p>${data.story || ""}</p>
        </div>
    `;

    /* =========================
       OPTIONS
    ========================= */

    if (data.options && data.options.length > 0) {

        html += `<div class="card">`;

        data.options.forEach((opt, i) => {

            html += `
                <div class="choice"
                    onclick="selectOption(${i}, ${opt.is_correct})">

                    ${opt.text}

                </div>
            `;
        });

        html += `</div>`;
    }

    /* =========================
       INTERACTIVE BLOCKS
    ========================= */

    if (data.interactive_blocks) {

        data.interactive_blocks.forEach(block => {

            if (block.type === "br" || block.type === "breath_auto") {
                html += renderBreathing(block);
            }

            if (block.type === "sil") {
                html += `
                    <div class="card fade">
                        <p>${block.text || ""}</p>
                        <small>${block.info || ""}</small>
                    </div>
                `;
            }
        });
    }

    html += `
        <button onclick="nextMission()">
            NEXT
        </button>
    `;

    app.innerHTML = html;

    /* trigger breathing AFTER render */
    initBreathing();
}

/* =========================
   BREATHING UI (FIXED)
   Floating, NOT blocking text
========================= */

function renderBreathing(block) {

    return `
        <div class="breath-wrapper">

            <div class="breath-circle" id="breathCircle">

                <span id="breathText">
                    INHALE
                </span>

            </div>

            <div class="breath-info">
                <p>${block.text || ""}</p>
                <small>${block.info || ""}</small>
            </div>

        </div>
    `;
}

/* =========================
   BREATH ENGINE (INHALE / EXHALE / INFLATE)
========================= */

function initBreathing() {

    const circle = document.getElementById("breathCircle");
    const text = document.getElementById("breathText");

    if (!circle || state.breathingActive) return;

    state.breathingActive = true;

    let inhale = true;

    setInterval(() => {

        if (!document.body.contains(circle)) return;

        if (inhale) {

            text.innerText = "INHALE";

            circle.style.transform = "scale(1.25)";
            circle.style.boxShadow = "0 0 40px rgba(0,242,255,0.6)";

        } else {

            text.innerText = "EXHALE";

            circle.style.transform = "scale(0.85)";
            circle.style.boxShadow = "0 0 15px rgba(0,242,255,0.2)";
        }

        inhale = !inhale;

    }, 3000);
}

/* =========================
   OPTION SELECT
========================= */

function selectOption(index, correct) {

    if (state.locked) return;

    state.locked = true;

    const choices = document.querySelectorAll(".choice");

    if (correct) {
        choices[index].style.background = "rgba(0,255,0,0.2)";
    } else {
        choices[index].style.background = "rgba(255,0,0,0.2)";
    }

    setTimeout(() => {
        state.locked = false;
    }, 1000);
}

/* =========================
   NEXT
========================= */

function nextMission() {
    loadMission();
}

/* =========================
   TIMER SYNC (FROM BACKEND)
========================= */

function startTimerSync() {

    setInterval(async () => {

        try {

            const res = await fetch("/api/mission/next?lang=" + state.lang);
            const data = await res.json();

            const timer = document.getElementById("timer");
            if (timer && data.time_left !== undefined) {

                let m = Math.floor(data.time_left / 60);
                let s = data.time_left % 60;

                timer.innerText =
                    String(m).padStart(2, "0") + ":" +
                    String(s).padStart(2, "0");
            }

        } catch (e) {}

    }, 2000);
}

/* =========================
   APP CREATOR
========================= */

function createApp() {

    const div = document.createElement("div");
    div.id = "app";
    document.body.appendChild(div);
    return div;
}
