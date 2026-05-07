/* =========================================================
   KAMIZEN ENGINE FINAL
   STABLE • NO DUPLICATES • NO FREEZE
   ORIGINAL GAMEPLAY PRESERVED
   FIXED FLOW + INF + SPEECH LOCK
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
   INIT
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

    const btn = $("start-btn");
    if (btn) btn.onclick = startTraining;
}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadAllData() {

    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    state.stories = normalize(await s.json());
    state.missions = normalize(await m.json());

    state.stories.sort((a,b)=>(a.id||0)-(b.id||0));
    state.missions.sort((a,b)=>(a.id||0)-(b.id||0));
}

function normalize(d){
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.stories)) return d.stories;
    if (Array.isArray(d.missions)) return d.missions;
    if (Array.isArray(d.data)) return d.data;
    return [];
}

/* =========================================================
   TRAIN LOOP (UNCHANGED FLOW)
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
   STORY (SPEECH LOCKED)
   ========================================================= */

async function runStory() {

    showOnly("story");

    const story = state.stories[state.current];

    const text =
        story?.en ||
        story?.story?.en ||
        "Story missing";

    $("story-text").innerText = text;

    const btn = $("story-next");
    btn.style.display = "none";

    await speak(text);

    btn.style.display = "block";
    await waitButton(btn);
}

/* =========================================================
   MISSION (FULL ORIGINAL STRUCTURE KEPT)
   ========================================================= */

async function runMission() {

    const mission = state.missions[state.current];
    if (!mission?.b) return;

    for (const b of mission.b) {

        if (!b) continue;

        if (b.t === "v" || b.t === "h") {
            await simple(mission.cat || "MISSION", b.tx?.en || "");
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
            await simple("REWARD", `${b.tx?.en || ""} +${b.p || 0} XP`);
        }

        else if (b.t === "c") {
            await simple("CONCLUSION", b.tx?.en || "");
        }
    }
}

/* =========================================================
   SIMPLE BLOCK
   ========================================================= */

async function simple(title, text) {

    showOnly("mission");

    $("mission-category").innerText = title;
    $("mission-main").innerText = text;
    $("answers").innerHTML = "";

    await speak(text);
    await waitButton($("continue-btn"));
}

/* =========================================================
   QUESTION (UNCHANGED LOGIC)
   ========================================================= */

async function question(b) {

    return new Promise(async (resolve) => {

        showOnly("mission");

        $("mission-main").innerText = b.q?.en || "";

        const box = $("answers");
        box.innerHTML = "";

        await speak(b.q?.en || "");

        let done = false;

        (b.op || []).forEach((opt, i) => {

            const btn = document.createElement("button");
            btn.className = "answer";
            btn.innerText = opt;

            btn.onclick = async () => {

                if (done) return;
                done = true;

                const ok = i === b.c;

                btn.classList.add(ok ? "correct" : "wrong");

                if (ok) state.xp += 10;

                updateHUD();

                const exp = b.ex?.[i] || "";
                $("mission-info").innerText = exp;

                await speak(exp);

                $("continue-btn").style.display = "block";
                $("continue-btn").onclick = resolve;
            };

            box.appendChild(btn);
        });
    });
}

/* =========================================================
   BREATHING (FIX INF + SPEECH COMPLETE)
   ========================================================= */

async function breathing(b) {

    showOnly("breathing");

    const text = $("breath-text");
    const info = $("breath-info");
    const circle = $("breath-circle");

    const main = b.tx?.en || "";
    const inf = b.inf?.en || "";

    if (info) info.innerText = inf;

    await speak(main + " " + inf);

    const cycles = Math.max(2, Math.floor((b.d || 20) / 4));

    for (let i = 0; i < cycles; i++) {

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

    $("mission-main").innerText = b.tx?.en || "";
    $("mission-info").innerText = b.inf?.en || "";

    await speak(b.tx?.en + " " + b.inf?.en);

    await wait((b.d || 10) * 1000);

    await waitButton($("continue-btn"));
}

/* =========================================================
   MINI GAME (RESTORED ORIGINAL STYLE)
   ========================================================= */

async function runMiniGame() {

    return new Promise((resolve) => {

        showOnly("game");

        const canvas = $("gameCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = innerWidth;
        canvas.height = innerHeight;

        const player = {
            x: canvas.width / 2,
            y: canvas.height - 120,
            size: 50
        };

        const objects = [];

        const goodWords = ["FOCUS","TRUTH","CONTROL","CALM","DISCIPLINE"];
        const badWords = ["ANGER","CHAOS","FEAR","IMPULSE"];

        let time = 0;

        state.gameRunning = true;

        function spawn() {

            objects.push({
                x: Math.random()*canvas.width,
                y: -20,
                speed: 2 + Math.random()*3,
                good: Math.random() > 0.4
            });
        }

        const interval = setInterval(spawn, 700);

        function loop() {

            if (!state.gameRunning) return;

            time++;

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            ctx.strokeStyle = "#00e5ff";
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size, 0, Math.PI*2);
            ctx.stroke();

            for (let i = objects.length-1; i>=0; i--) {

                const o = objects[i];
                o.y += o.speed;

                ctx.fillStyle = o.good ? "#22c55e" : "#ef4444";
                ctx.fillText(o.good ? goodWords[0] : badWords[0], o.x, o.y);

                if (o.y > canvas.height) objects.splice(i,1);
            }

            if (time > 900) {
                clearInterval(interval);
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

    if (screens[name]) screens[name].classList.remove("hidden");
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
