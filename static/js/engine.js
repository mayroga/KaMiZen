/* =========================================================
   KAMIZEN ENGINE - STATE FLOW VERSION
   NO FREEZE • NO LOOP HELL • CONTROLLED FLOW
   ========================================================= */

if (window.__KAMIZEN_ENGINE_RUNNING__) {
    console.warn("ENGINE ALREADY RUNNING");
} else {

window.__KAMIZEN_ENGINE_RUNNING__ = true;

/* =========================================================
   STATE MACHINE
   ========================================================= */

const state = {
    stories: [],
    missions: [],
    current: 0,
    xp: 0,

    phase: "boot", // boot → presentation → story → wordGame → missions → game2 → breathing → end

    speaking: false,
    gameRunning: false,

    wordGameActive: false,
    timer: 0,

    restartAllowed: false
};

/* =========================================================
   ELEMENTS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const screens = {
    loading: $("loading-screen"),
    start: $("start-screen"),
    story: $("story-screen"),
    mission: $("mission-screen"),
    breathing: $("breathing-screen"),
    game: $("game-screen")
};

const hudMission = $("hud-mission");
const hudXP = $("hud-xp");
const hudState = $("hud-state");

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

/* =========================================================
   INIT
   ========================================================= */

window.addEventListener("load", boot);

async function boot() {
    show("loading");
    await wait(2000);

    await loadData();

    show("start");

    $("start-btn").onclick = async () => {
        await presentationCountdown();
        runFlow();
    };
}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadData() {
    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const sd = await s.json();
    const md = await m.json();

    state.stories = Array.isArray(sd) ? sd : sd.stories || [];
    state.missions = Array.isArray(md) ? md : md.missions || [];
}

/* =========================================================
   PRESENTATION (5 MIN START DELAY)
   ========================================================= */

async function presentationCountdown() {
    show("start");

    const startTime = 5 * 60; // 5 minutes in seconds
    state.timer = startTime;

    return new Promise(resolve => {
        const interval = setInterval(() => {
            state.timer--;

            $("start-btn").innerText =
                `STARTING IN ${Math.floor(state.timer / 60)}:${String(state.timer % 60).padStart(2,'0')}`;

            if (state.timer <= 0) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
}

/* =========================================================
   MAIN FLOW (NO INFINITE LOOP)
   ========================================================= */

async function runFlow() {

    state.phase = "story";

    while (state.current < state.stories.length) {

        await runStory();

        await wordGame(5 * 60); // 5 minutes

        await runMission();

        await wordGame(120); // short second game

        state.current++;
    }

    await breathingFinal();

    endScreen();
}

/* =========================================================
   STORY
   ========================================================= */

async function runStory() {
    show("story");

    const story = state.stories[state.current];

    const text =
        story?.en || story?.text?.en || "Story missing";

    $("story-text").innerText = text;

    await speak(text);

    await waitClick("story-next");
}

/* =========================================================
   WORD GAME (FLOATING + LASER SYSTEM)
   ========================================================= */

async function wordGame(durationSeconds) {

    show("game");

    state.wordGameActive = true;
    state.gameRunning = true;

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const player = { x: canvas.width/2, y: canvas.height-100, r: 40 };

    const words = [];

    const good = ["FOCUS","TRUTH","DISCIPLINE","CALM","GROWTH"];
    const bad = ["ANGER","CHAOS","LIES","FEAR","IMPULSE"];

    function spawn() {
        if (!state.wordGameActive) return;

        const isBad = Math.random() < 0.45;

        words.push({
            x: Math.random()*canvas.width,
            y: -20,
            text: isBad ? bad.random() : good.random(),
            bad: isBad,
            speed: 2 + Math.random()*2
        });
    }

    const spawnInterval = setInterval(spawn, 600);

    let time = durationSeconds;

    const loop = () => {

        if (!state.wordGameActive) return;

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        // player
        ctx.strokeStyle = "#00f2ff";
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
        ctx.stroke();

        words.forEach((w,i) => {

            w.y += w.speed;

            // LASER SYSTEM (reframes bad words)
            if (w.bad) {
                ctx.strokeStyle = "#ff3131";
                ctx.beginPath();
                ctx.moveTo(player.x, player.y);
                ctx.lineTo(w.x, w.y);
                ctx.stroke();

                // "meaning change" mechanic
                if (distance(player,w) < 60) {
                    w.bad = false;
                    w.text = "NEUTRALIZED";
                }
            }

            ctx.fillStyle = w.bad ? "#ff3131" : "#2ecc71";
            ctx.font = "900 20px Orbitron";
            ctx.fillText(w.text, w.x, w.y);

            if (w.y > canvas.height + 50) words.splice(i,1);
        });

        time -= 1/60;

        if (time <= 0) {
            clearInterval(spawnInterval);
            state.wordGameActive = false;
            resolveLoop();
            return;
        }

        requestAnimationFrame(loop);
    };

    let resolveLoop;
    const p = new Promise(res => resolveLoop = res);

    loop();

    return p;
}

/* =========================================================
   MISSION
   ========================================================= */

async function runMission() {

    show("mission");

    const m = state.missions[state.current];
    if (!m) return;

    $("mission-question").innerText =
        m.q?.en || "MISSION";

    await waitClick("mission-next");
}

/* =========================================================
   SECOND GAME (SHORT)
   ========================================================= */

async function miniGame2() {
    await wordGame(60);
}

/* =========================================================
   BREATHING FINAL + SCIENTIFIC EXPLANATION
   ========================================================= */

async function breathingFinal() {

    show("breathing");

    const text = `
Breathing regulation activates the parasympathetic nervous system.
It reduces cortisol levels, lowers heart rate, and improves oxygen efficiency in the brain.
This stabilizes emotional response and enhances cognitive control.
    `;

    $("breath-text").innerText = "INHALE SLOWLY";

    await speak(text);

    await wait(8000);
}

/* =========================================================
   END SCREEN
   ========================================================= */

function endScreen() {

    state.restartAllowed = true;

    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:black;color:white;">
            <h1>SESSION COMPLETE</h1>
            <p>XP: ${state.xp}</p>
            <button onclick="location.reload()">RESTART</button>
        </div>
    `;
}

/* =========================================================
   HELPERS
   ========================================================= */

function show(name){
    Object.values(screens).forEach(s=>s?.classList?.add("hidden"));
    screens[name]?.classList?.remove("hidden");
}

function wait(ms){
    return new Promise(r=>setTimeout(r,ms));
}

function waitClick(id){
    return new Promise(r=>{
        $(id).onclick = () => r();
    });
}

function speak(text){
    return new Promise(res=>{
        if(!text) return res();
        const u = new SpeechSynthesisUtterance(text);
        u.onend = res;
        speechSynthesis.speak(u);
    });
}

function distance(a,b){
    return Math.hypot(a.x-b.x,a.y-b.y);
}

/* random helper */
Array.prototype.random = function(){
    return this[Math.floor(Math.random()*this.length)];
};

}
