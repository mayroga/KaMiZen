/* =========================================================
   KAMIZEN ENGINE — SEQUENTIAL FLOW VERSION
   NO FREEZE • STATE MACHINE • CLEAN LOOPS
   ========================================================= */

if (window.__KAMIZEN_ENGINE_RUNNING__) {
    console.warn("ENGINE ALREADY RUNNING");
} else {

window.__KAMIZEN_ENGINE_RUNNING__ = true;

/* =========================
   STATE
========================= */

const state = {
    stories: [],
    missions: [],
    index: 0,
    xp: 0,
    phase: "boot",
    running: false
};

/* =========================
   ELEMENTS
========================= */

const $ = (id) => document.getElementById(id);

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* =========================
   AUDIO (SAFE)
========================= */

let audioCtx;

function beep(freq = 440, type = "sine", time = 0.1) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.frequency.value = freq;
    o.type = type;
    g.gain.value = 0.05;

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start();
    o.stop(audioCtx.currentTime + time);
}

/* =========================
   UTIL
========================= */

const wait = (ms) => new Promise(r => setTimeout(r, ms));

/* =========================
   LOAD DATA
========================= */

async function loadData() {
    const [s, m] = await Promise.all([
        fetch("/api/stories").then(r => r.json()),
        fetch("/api/missions").then(r => r.json())
    ]);

    state.stories = Array.isArray(s) ? s : (s.stories || []);
    state.missions = Array.isArray(m) ? m : (m.missions || []);
}

/* =========================
   SPEECH
========================= */

function speak(text) {
    return new Promise(res => {
        if (!text) return res();

        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.95;

        u.onend = () => res();
        u.onerror = () => res();

        speechSynthesis.cancel();
        speechSynthesis.speak(u);
    });
}

/* =========================
   START FLOW
========================= */

window.addEventListener("load", async () => {
    await boot();
});

async function boot() {

    await loadData();

    await presentation();
    await storyPhase();

    await wordGame(300000); // 5 minutes

    await missionPhase();

    await wordGame(300000); // second game

    await breathingPhase();

    await endScreen();
}

/* =========================
   PRESENTATION
========================= */

async function presentation() {
    state.phase = "presentation";

    const overlay = $("overlay");
    if (overlay) overlay.style.display = "flex";

    await speak("Welcome to Kamizen. Decision training starts now.");

    await wait(2000);

    if (overlay) overlay.style.display = "none";
}

/* =========================
   STORIES
========================= */

async function storyPhase() {
    state.phase = "stories";

    for (let i = 0; i < state.stories.length; i++) {

        const story = state.stories[i];
        const text = story?.en || "Story missing";

        await speak(text);
        await wait(800);
    }
}

/* =========================
   WORD GAME (FLOATING + LASER MEANING SHIFT)
========================= */

function wordGame(duration) {
    return new Promise(resolve => {

        state.phase = "wordGame";

        let objects = [];
        let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

        const good = ["FOCUS", "TRUTH", "DISCIPLINE", "CALM"];
        const bad = ["ANGER", "CHAOS", "FEAR", "IMPULSE"];

        let start = Date.now();

        function spawn() {
            const isBad = Math.random() > 0.5;
            const text = isBad
                ? bad[Math.floor(Math.random() * bad.length)]
                : good[Math.floor(Math.random() * good.length)];

            objects.push({
                x: Math.random() * canvas.width,
                y: -20,
                speed: 2 + Math.random() * 2,
                text,
                bad: isBad,
                transformed: false
            });
        }

        let spawnInterval = setInterval(spawn, 700);

        function laserEffect(obj, dx, dy) {
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120 && obj.bad && !obj.transformed) {
                obj.bad = false;
                obj.text = "NEUTRALIZED";
                obj.transformed = true;
                beep(880, "triangle", 0.2);
            }
        }

        function loop() {

            if (Date.now() - start > duration) {
                clearInterval(spawnInterval);
                resolve();
                return;
            }

            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            objects.forEach((o, i) => {

                o.y += o.speed;

                const dx = mouse.x - o.x;
                const dy = mouse.y - o.y;

                laserEffect(o, dx, dy);

                ctx.strokeStyle = o.bad ? "#ff3131" : "#2ecc71";
                ctx.beginPath();
                ctx.moveTo(o.x, o.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();

                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "900 20px Orbitron";
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

async function missionPhase() {
    state.phase = "missions";

    for (let m of state.missions) {

        const blocks = m.b || [];

        for (let b of blocks) {
            if (b.t === "d") {
                await speak(b.q?.en || "");
                await wait(1500);
            }
        }
    }
}

/* =========================
   BREATHING + SCIENCE
========================= */

async function breathingPhase() {
    state.phase = "breathing";

    await speak("Start breathing exercise.");

    await wait(1000);

    await speak(
        "Deep breathing increases oxygen intake, reduces cortisol levels, and activates the parasympathetic nervous system, improving focus and lowering stress."
    );

    let cycles = 6;

    for (let i = 0; i < cycles; i++) {
        await speak("Inhale");
        await wait(2000);
        await speak("Exhale");
        await wait(2000);
    }
}

/* =========================
   END SCREEN + RESTART
========================= */

async function endScreen() {
    state.phase = "end";

    const overlay = $("overlay");
    if (overlay) {
        overlay.style.display = "flex";
        overlay.innerHTML = `
            <h1 style="color:#00f2ff">TRAINING COMPLETE</h1>
            <p>Restart in 5 minutes</p>
            <button id="restartBtn">RESTART NOW</button>
        `;
    }

    let time = 300;

    const interval = setInterval(() => {
        time--;
        if (time <= 0) location.reload();
    }, 1000);

    $("restartBtn").onclick = () => location.reload();
}

}
