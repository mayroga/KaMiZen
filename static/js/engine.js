/* =========================================================
   KAMIZEN ENGINE FINAL
   STABLE • NO DUPLICATES • NO FREEZE
   ENHANCED WORD LASER SYSTEM (PATCHED)
   ========================================================= */

if (window.__KAMIZEN_ENGINE_RUNNING__) {
    console.warn("ENGINE ALREADY RUNNING");
} else {

window.__KAMIZEN_ENGINE_RUNNING__ = true;

/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {

    stories: [],
    missions: [],
    current: 0,
    xp: 0,
    speaking: false,
    gameRunning: false
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

/* =========================================================
   BOOT
   ========================================================= */

window.addEventListener("load", bootSystem);

async function bootSystem() {

    showOnly("loading");

    await wait(2000);

    await loadAllData();

    if (!state.stories.length || !state.missions.length) {
        alert("Missing data");
        return;
    }

    showOnly("start");

    $("start-btn").onclick = startTraining;
}

/* =========================================================
   DATA
   ========================================================= */

async function loadAllData() {

    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    state.stories = normalize(await s.json());
    state.missions = normalize(await m.json());
}

function normalize(d) {
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.stories)) return d.stories;
    if (Array.isArray(d.missions)) return d.missions;
    if (Array.isArray(d.data)) return d.data;
    return [];
}

/* =========================================================
   TRAIN LOOP
   ========================================================= */

async function startTraining() {

    while (true) {

        if (state.current >= state.stories.length ||
            state.current >= state.missions.length) {
            state.current = 0;
        }

        updateHUD();

        await runStory();
        await runMiniGame();
        await runMission();
        await runMiniGame();

        state.current++;
    }
}

/* =========================================================
   STORY
   ========================================================= */

async function runStory() {

    showOnly("story");

    const text = state.stories[state.current]?.en || "Story missing";

    $("story-text").innerText = text;

    await speak(text);

    await waitButton($("story-next"));
}

/* =========================================================
   MISSION (UNCHANGED CORE)
   ========================================================= */

async function runMission() {

    const mission = state.missions[state.current];
    if (!mission?.b) return;

    for (const b of mission.b) {

        if (b.t === "v" || b.t === "h") {
            await simple("MISSION", b.tx?.en || "");
        }

        else if (b.story) {
            await simple("STORY", b.story?.en || "");
        }

        else if (b.t === "d") {
            await question(b);
        }

        else if (b.t === "breath_auto" || b.t === "br") {
            await breathing(b);
        }

        else if (b.t === "sil") {
            await silence(b);
        }

        else if (b.t === "r") {
            state.xp += Number(b.p || 0);
            updateHUD();
            await simple("REWARD", b.tx?.en || "");
        }

        else if (b.t === "c") {
            await simple("END", b.tx?.en || "");
        }
    }
}

/* =========================================================
   SIMPLE BLOCK
   ========================================================= */

async function simple(t, text) {

    showOnly("mission");

    $("mission-main").innerText = text;

    await speak(text);

    await waitButton($("continue-btn"));
}

/* =========================================================
   QUESTION (UNCHANGED)
   ========================================================= */

async function question(b) {

    return new Promise(async resolve => {

        showOnly("mission");

        $("mission-main").innerText = b.q?.en || "";

        const box = $("answers");
        box.innerHTML = "";

        await speak(b.q?.en || "");

        let done = false;

        (b.op || []).forEach((opt, i) => {

            const el = document.createElement("button");
            el.className = "answer";
            el.innerText = opt;

            el.onclick = async () => {

                if (done) return;
                done = true;

                const ok = i === b.c;

                el.classList.add(ok ? "correct" : "wrong");

                if (ok) state.xp += 10;

                updateHUD();

                await speak(b.ex?.[i] || "");

                $("continue-btn").onclick = resolve;
                $("continue-btn").style.display = "block";
            };

            box.appendChild(el);
        });
    });
}

/* =========================================================
   BREATHING (UNCHANGED)
   ========================================================= */

async function breathing(b) {

    showOnly("breathing");

    const text = $("breath-text");
    const circle = $("breath-circle");

    await speak((b.tx?.en || "") + " " + (b.inf?.en || ""));

    for (let i = 0; i < 3; i++) {

        text.innerText = "INHALE";
        circle.style.transform = "scale(1.3)";
        await wait(4000);

        text.innerText = "EXHALE";
        circle.style.transform = "scale(1)";
        await wait(4000);
    }
}

/* =========================================================
   SILENCE
   ========================================================= */

async function silence(b) {

    showOnly("mission");

    await speak(b.tx?.en || "");

    await wait((b.d || 10) * 1000);

    await waitButton($("continue-btn"));
}

/* =========================================================
   MINI GAME — ENHANCED WORD LASER SYSTEM
   ========================================================= */

async function runMiniGame() {

    return new Promise(resolve => {

        showOnly("game");

        state.gameRunning = true;

        const canvas = $("gameCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = innerWidth;
        canvas.height = innerHeight;

        const player = { x: canvas.width/2, y: canvas.height-120, r: 55 };

        const objects = [];

        const floatingWords = [
            "FOCUS", "TRUTH", "CONTROL", "CALM", "DISCIPLINE",
            "SPEED", "NOISE", "DISTRACTION", "ANGER", "FEAR"
        ];

        const good = ["FOCUS","TRUTH","CONTROL","CALM","DISCIPLINE"];

        /* =====================================================
           FLOATING WORD GENERATOR
        ===================================================== */

        setInterval(() => {

            if (!state.gameRunning) return;

            objects.push({
                x: Math.random() * canvas.width,
                y: -20,
                text: floatingWords[Math.floor(Math.random()*floatingWords.length)],
                speed: 2 + Math.random()*3
            });

        }, 600);

        /* =====================================================
           INPUT
        ===================================================== */

        function move(e) {
            player.x = e.clientX || e.touches?.[0]?.clientX || player.x;
        }

        window.addEventListener("mousemove", move);

        /* =====================================================
           MAIN LOOP
        ===================================================== */

        function loop() {

            if (!state.gameRunning) return;

            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            /* PLAYER */
            ctx.strokeStyle = "#00e5ff";
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
            ctx.stroke();

            /* WORDS + LASER LOGIC */
            for (let i = objects.length-1; i>=0; i--) {

                const o = objects[i];
                o.y += o.speed;

                const isBad = !good.includes(o.text);

                /* LASER EFFECT */
                ctx.strokeStyle = isBad ? "#ff3131" : "#00f2ff";
                ctx.lineWidth = isBad ? 3 : 1;

                ctx.beginPath();
                ctx.moveTo(o.x, o.y);
                ctx.lineTo(player.x, player.y);
                ctx.stroke();

                /* TEXT */
                ctx.fillStyle = isBad ? "#ff3131" : "#2ecc71";
                ctx.font = "900 22px Orbitron";
                ctx.textAlign = "center";
                ctx.fillText(o.text, o.x, o.y);

                /* LASER MEANING SHIFT */
                if (isBad && Math.random() < 0.01) {
                    o.text = "⚡ REFORMED " + o.text;
                }

                if (o.y > canvas.height) objects.splice(i,1);
            }

            requestAnimationFrame(loop);
        }

        loop();

        setTimeout(() => {
            state.gameRunning = false;
            resolve();
        }, 20000);
    });
}

/* =========================================================
   SPEECH
   ========================================================= */

function speak(text) {

    return new Promise(resolve => {

        if (!text) return resolve();

        speechSynthesis.cancel();

        const u = new SpeechSynthesisUtterance(text);

        u.lang = "en-US";
        u.rate = 0.92;

        u.onend = resolve;

        speechSynthesis.speak(u);
    });
}

/* =========================================================
   HELPERS
   ========================================================= */

function showOnly(name) {

    Object.values(screens).forEach(s => s?.classList.add("hidden"));

    screens[name]?.classList.remove("hidden");
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

function waitButton(btn){

    return new Promise(r=>{
        btn.onclick = () => r();
    });
}

function updateHUD(){

    hudMission.innerText = state.current + 1;
    hudXP.innerText = state.xp;
    hudState.innerText = state.speaking ? "VOICE":"FOCUS";
}

}
