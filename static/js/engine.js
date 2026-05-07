/* =========================================================
   KAMIZEN ENGINE FINAL FIXED
   STABLE • NO DUPLICATES • NO FREEZE • FULL SPEECH LOCK
   ========================================================= */

if (window.__KAMIZEN_ENGINE_RUNNING__) {
    console.warn("ENGINE ALREADY RUNNING");
} else {

window.__KAMIZEN_ENGINE_RUNNING__ = true;

/* =========================================================
   STATE
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
   ELEMENTS SAFE GRAB
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
   INIT
   ========================================================= */

window.addEventListener("load", bootSystem);

async function bootSystem() {

    try {

        showOnly("loading");

        await wait(2000);

        await loadAllData();

        if (!state.stories.length || !state.missions.length) {
            alert("Missing data");
            return;
        }

        showOnly("start");

        const btn = $("start-btn");
        if (btn) {
            btn.onclick = startTraining;
        }

    } catch (e) {
        console.error(e);
        alert("SYSTEM ERROR");
    }
}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadAllData() {

    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const stories = await s.json();
    const missions = await m.json();

    state.stories = normalize(stories);
    state.missions = normalize(missions);

    state.stories.sort((a,b)=> (a.id||0)-(b.id||0));
    state.missions.sort((a,b)=> (a.id||0)-(b.id||0));
}

function normalize(d){
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.stories)) return d.stories;
    if (Array.isArray(d.missions)) return d.missions;
    if (Array.isArray(d.data)) return d.data;
    return [];
}

/* =========================================================
   TRAIN LOOP (CONTROLLED SAFE LOOP)
   ========================================================= */

let trainingRunning = false;

async function startTraining() {

    if (trainingRunning) return;
    trainingRunning = true;

    while (trainingRunning) {

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
   STORY (LOCKED SPEECH)
   ========================================================= */

async function runStory() {

    showOnly("story");

    const story = state.stories[state.current];

    const text =
        story?.en ||
        story?.story?.en ||
        "Missing story";

    $("story-text").innerText = text;

    const btn = $("story-next");
    if (btn) btn.style.display = "none";

    await speak(text);

    if (btn) {
        btn.style.display = "block";
        await waitButton(btn);
    }
}

/* =========================================================
   MISSION CORE
   ========================================================= */

async function runMission() {

    const mission = state.missions[state.current];
    if (!mission?.b) return;

    for (const b of mission.b) {

        if (!b) continue;

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

            await simple("REWARD", `${b.tx?.en || ""} +${b.p || 0}`);
        }

        else if (b.t === "c") {

            await simple("END", b.tx?.en || "");
        }
    }
}

/* =========================================================
   SIMPLE BLOCK
   ========================================================= */

async function simple(title, text) {

    showOnly("mission");

    const cat = $("mission-category");
    const main = $("mission-main");
    const btn = $("continue-btn");

    if (cat) cat.innerText = title;
    if (main) main.innerText = text;
    if (btn) btn.style.display = "none";

    await speak(text);

    if (btn) {
        btn.style.display = "block";
        await waitButton(btn);
    }
}

/* =========================================================
   QUESTION
   ========================================================= */

async function question(b) {

    return new Promise(async (resolve) => {

        showOnly("mission");

        $("mission-main").innerText = b.q?.en || "";

        const box = $("answers");
        box.innerHTML = "";

        let done = false;

        await speak(b.q?.en || "");

        (b.op || []).forEach((opt, i) => {

            const el = document.createElement("button");
            el.innerText = opt;
            el.className = "answer";

            el.onclick = async () => {

                if (done) return;
                done = true;

                const ok = i === b.c;

                el.classList.add(ok ? "correct" : "wrong");

                if (ok) state.xp += 10;
                updateHUD();

                const exp = b.ex?.[i] || "";
                $("mission-info").innerText = exp;

                await speak(exp);

                const btn = $("continue-btn");
                btn.style.display = "block";

                btn.onclick = resolve;
            };

            box.appendChild(el);
        });
    });
}

/* =========================================================
   BREATHING (FIXED INF + NO SKIP)
   ========================================================= */

async function breathing(b) {

    showOnly("breathing");

    const text = $("breath-text");
    const info = $("breath-info");
    const circle = $("breath-circle");

    const main = b.tx?.en || "Inhale / Exhale";
    const inf = b.inf?.en || "";

    if (info) info.innerText = inf;

    await speak(main + ". " + inf);

    const cycles = Math.max(2, Math.floor((b.d || 20) / 4));

    for (let i = 0; i < cycles; i++) {

        if (text) text.innerText = "INHALE";
        if (circle) circle.style.transform = "scale(1.3)";
        await wait(4000);

        if (text) text.innerText = "EXHALE";
        if (circle) circle.style.transform = "scale(1)";
        await wait(4000);
    }
}

/* =========================================================
   SILENCE
   ========================================================= */

async function silence(b) {

    showOnly("mission");

    $("mission-main").innerText = b.tx?.en || "";
    $("mission-info").innerText = b.inf?.en || "";

    await speak((b.tx?.en || "") + " " + (b.inf?.en || ""));

    await wait((b.d || 10) * 1000);

    await waitButton($("continue-btn"));
}

/* =========================================================
   MINI GAME SAFE
   ========================================================= */

async function runMiniGame() {

    return new Promise((resolve) => {

        showOnly("game");

        state.gameRunning = true;

        const canvas = $("gameCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = innerWidth;
        canvas.height = innerHeight;

        const player = { x: canvas.width/2, y: canvas.height-120, r: 50 };
        const objs = [];

        const good = ["FOCUS","TRUTH","CONTROL"];
        const bad = ["FEAR","IMPULSE","CHAOS"];

        let t = 0;

        const spawn = setInterval(() => {

            objs.push({
                x: Math.random()*canvas.width,
                y: -20,
                good: Math.random() > 0.4,
                speed: 2 + Math.random()*3
            });

        }, 700);

        function loop() {

            if (!state.gameRunning) return;

            t++;

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            ctx.strokeStyle = "#00e5ff";
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
            ctx.stroke();

            for (let i = objs.length-1; i>=0; i--) {

                const o = objs[i];
                o.y += o.speed;

                ctx.fillStyle = o.good ? "#22c55e" : "#ef4444";
                ctx.fillText(o.good ? good[0] : bad[0], o.x, o.y);

                if (o.y > canvas.height) objs.splice(i,1);
            }

            if (t > 900) {

                clearInterval(spawn);
                state.gameRunning = false;
                resolve();
                return;
            }

            requestAnimationFrame(loop);
        }

        loop();
    });
}

/* =========================================================
   SPEECH LOCK
   ========================================================= */

function speak(text) {

    return new Promise((resolve) => {

        if (!text || !speechSynthesis) return resolve();

        speechSynthesis.cancel();

        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.92;

        state.speaking = true;

        u.onend = () => {
            state.speaking = false;
            resolve();
        };

        u.onerror = resolve;

        speechSynthesis.speak(u);
    });
}

/* =========================================================
   HELPERS
   ========================================================= */

function showOnly(name) {

    Object.values(screens).forEach(s => {
        if (s) s.classList.add("hidden");
    });

    if (screens[name]) {
        screens[name].classList.remove("hidden");
    }
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

function waitButton(btn){

    return new Promise(r=>{
        btn.onclick = ()=>r();
    });
}

function updateHUD(){

    if (hudMission) hudMission.innerText = state.current+1;
    if (hudXP) hudXP.innerText = state.xp;
    if (hudState) hudState.innerText = state.speaking ? "VOICE":"FOCUS";
}

}
