/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM (FIXED FLOW)
   STORIES → WORD GAME → MISSIONS → WORD GAME → BREATHING → END
   ========================================================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading",

    speechLocked: false,
    initialized: false
};

/* ENGINE LOCK */
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

    app.innerHTML = `<div class="card"><h2>LOADING SYSTEM...</h2></div>`;

    try {

        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a, b) => a.id - b.id)
            : [];

        state.initialized = true;

    } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="card"><h2>LOAD ERROR</h2></div>`;
    }
}

/* =========================
   INTRO
========================= */

function showIntro() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>KAMIZEN SYSTEM</h1>
            <p>Stories • Cognition • Survival Logic</p>
        </div>

        <button onclick="startFlow()">START SYSTEM</button>
    `;
}

/* =========================
   MAIN FLOW CONTROLLER
========================= */

async function startFlow() {

    state.currentIndex = 0;
    state.currentBlock = 0;

    await runStories();

    await wordGame(300000); // 🔥 AFTER STORIES (5 MIN)

    await runMissions();

    await wordGame(300000); // 🔥 AFTER MISSIONS

    await breathingPhase();

    await endScreen();
}

/* =========================
   STORIES
========================= */

async function runStories() {

    const app = document.getElementById("app");

    state.phase = "stories";

    for (let s of state.stories) {

        app.innerHTML = `
            <div class="card">
                <h2>${s.t || ""}</h2>
                <p>${s.en || ""}</p>
            </div>
        `;

        await speak(s.en || "");
        await wait(1200);
    }
}

/* =========================
   WORD GAME (FLOATING + LASER SHIFT MEANING)
========================= */

function wordGame(duration) {

    return new Promise(resolve => {

        state.phase = "wordgame";

        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let objects = [];
        let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

        const good = ["FOCUS", "TRUTH", "DISCIPLINE", "CONTROL", "CALM"];
        const bad = ["ANGER", "CHAOS", "FEAR", "IMPULSE", "DISTRACTION"];

        const start = Date.now();

        function spawn() {

            const isBad = Math.random() > 0.5;

            objects.push({
                x: Math.random() * canvas.width,
                y: -20,
                speed: 2 + Math.random() * 2,
                text: isBad ? bad[Math.floor(Math.random() * bad.length)]
                            : good[Math.floor(Math.random() * good.length)],
                bad: isBad,
                neutralized: false
            });
        }

        setInterval(spawn, 700);

        function loop() {

            if (Date.now() - start > duration) {
                resolve();
                return;
            }

            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            objects.forEach((o, i) => {

                o.y += o.speed;

                const dx = mouse.x - o.x;
                const dy = mouse.y - o.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                /* 🔥 LASER MEANING SHIFT */
                if (dist < 120 && o.bad && !o.neutralized) {
                    o.text = "NEUTRALIZED";
                    o.bad = false;
                    o.neutralized = true;
                }

                ctx.strokeStyle = o.bad ? "#ff3131" : "#2ecc71";

                ctx.beginPath();
                ctx.moveTo(o.x, o.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();

                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "900 20px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText(o.text, o.x, o.y);

                if (o.y > canvas.height + 50) objects.splice(i, 1);
            });

            requestAnimationFrame(loop);
        }

        window.onmousemove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        loop();
    });
}

/* =========================
   MISSIONS
========================= */

async function runMissions() {

    state.phase = "missions";

    const app = document.getElementById("app");

    for (let m of state.missions) {

        const blocks = m.b || [];

        for (let b of blocks) {

            app.innerHTML = `
                <div class="card">
                    <h3>${b.tx?.en || b.q?.en || ""}</h3>
                </div>
            `;

            await speak(b.tx?.en || b.q?.en || "");
        }
    }
}

/* =========================
   BREATHING + SCIENCE
========================= */

async function breathingPhase() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>BREATHING RESET</h2>
            <p>Oxygen regulation active</p>
        </div>
    `;

    await speak(
        "Deep breathing increases oxygen intake, reduces cortisol, and activates the parasympathetic nervous system."
    );

    for (let i = 0; i < 6; i++) {
        await speak("Inhale");
        await wait(2000);
        await speak("Exhale");
        await wait(2000);
    }
}

/* =========================
   END SCREEN
========================= */

async function endScreen() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>TRAINING COMPLETE</h1>
            <p>System restart in 5 minutes</p>
        </div>

        <button onclick="location.reload()">RESTART NOW</button>
    `;

    setTimeout(() => location.reload(), 300000);
}

/* =========================
   HELPERS
========================= */

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function speak(text) {
    return new Promise(res => {
        const u = new SpeechSynthesisUtterance(text);
        u.onend = res;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
    });
}
