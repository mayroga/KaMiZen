/* =========================================================
   KAMIZEN ENGINE FINAL
   STABLE • NO DUPLICATES • NO FREEZE
   READS ALL 35 STORIES + 35 MISSIONS
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
    locked: false,

    gameRunning: false,

    voice: null
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
   START
   ========================================================= */

window.addEventListener("load", async () => {

    await bootSystem();

});

/* =========================================================
   BOOT SYSTEM
   ========================================================= */

async function bootSystem() {

    try {

        showOnly("loading");

        await wait(2200);

        await loadAllData();

        console.log("Stories:", state.stories.length);
        console.log("Missions:", state.missions.length);

        if (!state.stories.length || !state.missions.length) {

            alert("Stories or Missions missing");
            return;
        }

        showOnly("start");

        $("start-btn").onclick = async () => {

            await startTraining();
        };

    } catch (err) {

        console.error("BOOT ERROR", err);

        alert("SYSTEM ERROR");
    }
}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadAllData() {

    const [storiesRes, missionsRes] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const storiesData = await storiesRes.json();
    const missionsData = await missionsRes.json();

    state.stories = normalizeStories(storiesData);
    state.missions = normalizeMissions(missionsData);

    state.stories.sort((a, b) => (a.id || 0) - (b.id || 0));
    state.missions.sort((a, b) => (a.id || 0) - (b.id || 0));
}

/* =========================================================
   NORMALIZERS
   ========================================================= */

function normalizeStories(data) {

    if (Array.isArray(data)) return data;

    if (Array.isArray(data.stories)) return data.stories;

    if (Array.isArray(data.data)) return data.data;

    return [];
}

function normalizeMissions(data) {

    if (Array.isArray(data)) return data;

    if (Array.isArray(data.missions)) return data.missions;

    if (Array.isArray(data.data)) return data.data;

    return [];
}

/* =========================================================
   MAIN TRAINING LOOP
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

    const story = state.stories[state.current];

    const storyText =
        story?.en ||
        story?.text?.en ||
        story?.story?.en ||
        "Story missing";

    $("story-id").innerText = `STORY ${state.current + 1}`;

    $("story-text").innerText = storyText;

    const btn = $("story-btn");

    btn.classList.add("hidden");

    await speak(storyText);

    btn.classList.remove("hidden");

    await waitButton(btn);
}

/* =========================================================
   MISSION
   ========================================================= */

async function runMission() {

    const mission = state.missions[state.current];

    if (!mission || !Array.isArray(mission.b)) return;

    const blocks = mission.b;

    for (let i = 0; i < blocks.length; i++) {

        const b = blocks[i];

        if (!b) continue;

        /* =========================
           VISUAL
        ========================= */

        if (b.t === "v") {

            await showSimpleMission(
                mission.cat || "MISSION",
                b.tx?.en || ""
            );
        }

        /* =========================
           HEADER
        ========================= */

        else if (b.t === "h") {

            await showSimpleMission(
                mission.cat || "MISSION",
                b.tx?.en || ""
            );
        }

        /* =========================
           STORY BLOCK
        ========================= */

        else if (b.story) {

            await showSimpleMission(
                "STORY",
                b.story?.en || ""
            );
        }

        /* =========================
           QUESTION
        ========================= */

        else if (b.t === "d") {

            await runQuestionBlock(b);
        }

        /* =========================
           BREATHING
        ========================= */

        else if (
            b.t === "breath_auto" ||
            b.t === "br"
        ) {

            await runBreathingBlock(b);
        }

        /* =========================
           SILENCE
        ========================= */

        else if (b.t === "sil") {

            await runSilenceBlock(b);
        }

        /* =========================
           REWARD
        ========================= */

        else if (b.t === "r") {

            state.xp += Number(b.p || 0);

            updateHUD();

            await showSimpleMission(
                "REWARD",
                `${b.tx || ""} +${b.p || 0} XP`
            );
        }

        /* =========================
           CONCLUSION
        ========================= */

        else if (b.t === "c") {

            await showSimpleMission(
                "CONCLUSION",
                b.tx?.en || ""
            );
        }
    }
}

/* =========================================================
   SIMPLE MISSION BLOCK
   ========================================================= */

async function showSimpleMission(title, text) {

    showOnly("mission");

    $("mission-category").innerText = title;

    $("mission-main").innerText = text;

    $("mission-info").innerText = "";

    $("answers").innerHTML = "";

    const btn = $("continue-btn");

    btn.classList.add("hidden");

    await speak(text);

    btn.classList.remove("hidden");

    await waitButton(btn);
}

/* =========================================================
   QUESTION BLOCK
   ========================================================= */

async function runQuestionBlock(b) {

    return new Promise(async (resolve) => {

        showOnly("mission");

        $("mission-category").innerText = "DECISION";

        $("mission-main").innerText = b.q?.en || "";

        $("mission-info").innerText = "";

        const answers = $("answers");

        answers.innerHTML = "";

        $("continue-btn").classList.add("hidden");

        await speak(b.q?.en || "");

        let answered = false;

        (b.op || []).forEach((option, index) => {

            const div = document.createElement("button");

            div.className = "answer";

            div.innerText = option;

            div.onclick = async () => {

                if (answered) return;

                answered = true;

                const correct = index === b.c;

                div.classList.add(
                    correct ? "correct" : "wrong"
                );

                if (correct) {

                    state.xp += 10;

                    updateHUD();
                }

                const explanation =
                    b.ex?.[index] || "";

                $("mission-info").innerText = explanation;

                await speak(explanation);

                $("continue-btn").classList.remove("hidden");

                $("continue-btn").onclick = () => {

                    resolve();
                };
            };

            answers.appendChild(div);
        });
    });
}

/* =========================================================
   BREATHING BLOCK
   ========================================================= */

async function runBreathingBlock(b) {

    showOnly("breathing");

    const breathText = $("breath-text");
    const breathInfo = $("breath-info");
    const circle = $("breath-circle");

    const mainText =
        b.tx?.en ||
        "Inhale and Exhale";

    const infoText =
        b.inf?.en ||
        "";

    breathInfo.innerText = infoText;

    const duration = Number(b.d || 20);

    await speak(`${mainText}. ${infoText}`);

    const cycles = Math.max(2, Math.floor(duration / 4));

    for (let i = 0; i < cycles; i++) {

        breathText.innerText = "INHALE";

        circle.style.transform = "scale(1.28)";

        await wait(4000);

        breathText.innerText = "EXHALE";

        circle.style.transform = "scale(1)";

        await wait(4000);
    }
}

/* =========================================================
   SILENCE BLOCK
   ========================================================= */

async function runSilenceBlock(b) {

    showOnly("mission");

    $("mission-category").innerText = "FOCUS";

    $("mission-main").innerText =
        b.tx?.en || "Focus";

    $("mission-info").innerText =
        b.inf?.en || "";

    $("answers").innerHTML = "";

    $("continue-btn").classList.add("hidden");

    await speak(
        `${b.tx?.en || ""}. ${b.inf?.en || ""}`
    );

    await wait(Number(b.d || 10) * 1000);

    $("continue-btn").classList.remove("hidden");

    await waitButton($("continue-btn"));
}

/* =========================================================
   MINI GAME
   ========================================================= */

async function runMiniGame() {

    return new Promise((resolve) => {

        showOnly("game");

        const canvas = $("gameCanvas");

        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const player = {
            x: canvas.width / 2,
            y: canvas.height - 120,
            size: 50
        };

        const objects = [];

        const goodWords = [
            "FOCUS",
            "TRUTH",
            "CONTROL",
            "CALM",
            "DISCIPLINE"
        ];

        const badWords = [
            "ANGER",
            "CHAOS",
            "FEAR",
            "IMPULSE"
        ];

        let gameTime = 0;

        state.gameRunning = true;

        function spawnObject() {

            const good = Math.random() > 0.4;

            const text = good
                ? goodWords[Math.floor(Math.random() * goodWords.length)]
                : badWords[Math.floor(Math.random() * badWords.length)];

            objects.push({
                x: Math.random() * (canvas.width - 100) + 50,
                y: -20,
                speed: 2 + Math.random() * 3,
                text,
                good
            });
        }

        const interval = setInterval(spawnObject, 700);

        function move(e) {

            player.x =
                e.clientX ||
                e.touches?.[0]?.clientX ||
                player.x;
        }

        window.addEventListener("mousemove", move);
        window.addEventListener("touchmove", move);

        function loop() {

            if (!state.gameRunning) return;

            gameTime++;

            ctx.fillStyle = "rgba(0,0,0,.35)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            /* PLAYER */

            ctx.beginPath();
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 5;
            ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
            ctx.stroke();

            /* OBJECTS */

            for (let i = objects.length - 1; i >= 0; i--) {

                const o = objects[i];

                o.y += o.speed;

                ctx.font = "900 22px Orbitron";

                ctx.textAlign = "center";

                ctx.fillStyle = o.good
                    ? "#22c55e"
                    : "#ef4444";

                ctx.fillText(o.text, o.x, o.y);

                const dx = o.x - player.x;
                const dy = o.y - player.y;

                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < player.size + 20) {

                    if (o.good) {

                        state.xp += 5;
                    } else {

                        state.xp = Math.max(0, state.xp - 3);
                    }

                    updateHUD();

                    objects.splice(i, 1);
                }

                if (o.y > canvas.height + 50) {

                    objects.splice(i, 1);
                }
            }

            if (gameTime > 900) {

                endGame();
                return;
            }

            requestAnimationFrame(loop);
        }

        function endGame() {

            state.gameRunning = false;

            clearInterval(interval);

            window.removeEventListener("mousemove", move);
            window.removeEventListener("touchmove", move);

            resolve();
        }

        loop();
    });
}

/* =========================================================
   SPEECH
   ========================================================= */

function speak(text) {

    return new Promise((resolve) => {

        if (!text || !window.speechSynthesis) {

            resolve();
            return;
        }

        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);

        utter.lang = "en-US";

        utter.rate = 0.92;

        utter.pitch = 1;

        utter.volume = 1;

        state.speaking = true;

        utter.onend = () => {

            state.speaking = false;

            resolve();
        };

        utter.onerror = () => {

            state.speaking = false;

            resolve();
        };

        window.speechSynthesis.speak(utter);
    });
}

/* =========================================================
   WAIT BUTTON
   ========================================================= */

function waitButton(button) {

    return new Promise((resolve) => {

        const handler = () => {

            button.onclick = null;

            resolve();
        };

        button.onclick = handler;
    });
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    hudMission.innerText =
        `${state.current + 1}/35`;

    hudXP.innerText =
        state.xp;

    hudState.innerText =
        state.speaking
            ? "VOICE"
            : "FOCUS";
}

/* =========================================================
   HELPERS
   ========================================================= */

function showOnly(name) {

    Object.values(screens).forEach((s) => {

        s.classList.add("hidden");
    });

    screens[name].classList.remove("hidden");
}

function wait(ms) {

    return new Promise((resolve) => {

        setTimeout(resolve, ms);
    });
}

}
