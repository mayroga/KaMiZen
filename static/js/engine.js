/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM
   + WORD GAME INTEGRATION (MID + END)
   ========================================================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading",

    speechLocked: false,
    initialized: false,

    gameActive: false
};

/* =========================
   ENGINE LOCK
========================= */

if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("ENGINE ALREADY RUNNING");
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

    app.innerHTML = `<div class="card"><h2>LOADING...</h2></div>`;

    const [storiesReq, missionsReq] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const storiesData = await storiesReq.json();
    const missionsData = await missionsReq.json();

    state.stories = Array.isArray(storiesData.stories)
        ? storiesData.stories.sort((a,b)=>a.id-b.id)
        : [];

    state.missions = Array.isArray(missionsData.missions)
        ? missionsData.missions.sort((a,b)=>a.id-b.id)
        : [];

    console.log("STORIES:", state.stories.length);
    console.log("MISSIONS:", state.missions.length);

    state.initialized = true;
}

/* =========================
   INTRO
========================= */

function showIntro() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>KAMIZEN SYSTEM</h1>
            <p>Stories → Focus → Decisions → Control</p>
        </div>

        <button onclick="startSystem()">START</button>
    `;
}

/* =========================
   START SYSTEM
========================= */

function startSystem() {

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    renderStory();
}

/* =========================
   STORY PHASE
========================= */

function renderStory() {

    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];

    if (!story) return;

    app.innerHTML = `
        <div class="card">
            <h2>STORY ${story.id}</h2>
            <p>${story.en || ""}</p>
        </div>

        <button id="nextBtn" disabled>NARRATING...</button>
    `;

    speak(story.en, async () => {

        document.getElementById("nextBtn").disabled = false;
        document.getElementById("nextBtn").innerText = "CONTINUE";

        document.getElementById("nextBtn").onclick = async () => {

            await wordGame(300000); // 🎮 MID GAME (5 min)

            state.phase = "mission";
            state.currentBlock = 0;

            renderMission();
        };
    });
}

/* =========================
   WORD GAME (FLOATING + LASER SEMANTIC SHIFT)
========================= */

function wordGame(duration) {

    return new Promise(resolve => {

        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let objects = [];
        let mouse = { x: canvas.width/2, y: canvas.height/2 };

        const good = ["FOCUS","TRUTH","CALM","CONTROL"];
        const bad = ["ANGER","CHAOS","FEAR","IMPULSE"];

        let start = Date.now();

        function spawn() {

            const isBad = Math.random() > 0.5;

            const text = isBad
                ? bad[Math.floor(Math.random()*bad.length)]
                : good[Math.floor(Math.random()*good.length)];

            objects.push({
                x: Math.random()*canvas.width,
                y: -20,
                speed: 2+Math.random()*2,
                text,
                bad: isBad,
                transformed: false
            });
        }

        let interval = setInterval(spawn, 600);

        function loop() {

            if (Date.now() - start > duration) {

                clearInterval(interval);
                resolve();
                return;
            }

            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            objects.forEach((o,i)=>{

                o.y += o.speed;

                const dx = mouse.x - o.x;
                const dy = mouse.y - o.y;

                const dist = Math.sqrt(dx*dx+dy*dy);

                // LASER TRANSFORM LOGIC
                if (dist < 120 && o.bad && !o.transformed) {

                    o.bad = false;
                    o.text = "REDEFINED";
                    o.transformed = true;
                }

                ctx.strokeStyle = o.bad ? "#ff3131" : "#2ecc71";
                ctx.beginPath();
                ctx.moveTo(o.x,o.y);
                ctx.lineTo(mouse.x,mouse.y);
                ctx.stroke();

                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "900 20px Orbitron";
                ctx.fillText(o.text,o.x,o.y);

                if (o.y > canvas.height) objects.splice(i,1);
            });

            requestAnimationFrame(loop);
        }

        window.onmousemove = e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        loop();
    });
}

/* =========================
   MISSION PHASE (FULL ORIGINAL STRUCTURE PRESERVED)
========================= */

function renderMission() {

    const app = document.getElementById("app");

    const mission = state.missions[state.currentIndex];

    if (!mission) {
        nextStory();
        return;
    }

    const block = mission.b[state.currentBlock];

    if (!block) {

        // 👉 AFTER MISSIONS → FINAL WORD GAME
        wordGame(300000).then(() => breathingPhase());
        return;
    }

    let html = "";
    let text = "";

    if (block.t === "v" || block.t === "h") {

        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
        text += block.tx?.en || "";
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;

        (block.op || []).forEach((o,i)=>{
            html += `<button onclick="answer(${i},${block.c},'${JSON.stringify(block.ex)}')">${o}</button>`;
        });

        html += `</div>`;
    }

    if (block.t === "br") {

        html += `
            <div class="card">
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>
        `;

        text += `${block.tx?.en} ${block.inf?.en}`;
    }

    app.innerHTML = html;

    speak(text, () => {
        state.currentBlock++;
        renderMission();
    });
}

/* =========================
   ANSWER
========================= */

function answer(i, correct, ex) {

    const explanations = JSON.parse(ex || "[]");

    const app = document.getElementById("app");

    app.innerHTML += `
        <div class="card">
            <p>${explanations[i] || ""}</p>
            <button onclick="nextBlock()">CONTINUE</button>
        </div>
    `;
}

function nextBlock() {
    state.currentBlock++;
    renderMission();
}

/* =========================
   AFTER MISSIONS → BREATHING
========================= */

async function breathingPhase() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>BREATHING RESET</h2>
            <p>
            Deep breathing increases oxygen intake,
            reduces cortisol and activates parasympathetic system,
            improving focus and lowering stress.
            </p>
        </div>

        <button onclick="restartCountdown()">RESTART</button>
    `;
}

/* =========================
   RESTART 5 MIN COUNTDOWN
========================= */

function restartCountdown() {

    let t = 300;

    const id = setInterval(()=>{

        t--;

        if (t <= 0) location.reload();

    },1000);
}

/* =========================
   SPEECH
========================= */

function speak(text, cb) {

    if (!text) return cb?.();

    const u = new SpeechSynthesisUtterance(text);

    u.onend = () => cb?.();

    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

/* =========================
   STORY LOOP
========================= */

function nextStory() {

    state.currentIndex++;

    if (state.currentIndex >= state.stories.length) {
        state.currentIndex = 0;
    }

    renderStory();
}
