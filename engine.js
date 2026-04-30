/* =========================
🧠 KAMIZEN ENGINE - ADAPTIVE CORE
========================= */

let lang = "en";
let gameMode = "idle";

let state = {
    score: 0,
    mastery: 1,
    timer: 300,
    stats: {
        respect: 50,
        peace: 50,
        lead: 50,
        money: 100,
        happy: 50,
        safety: 100
    },
    spawnRate: 1300,
    difficulty: 1
};

let userProfile = {};

/* =========================
🧬 APPLY PROFILE (ADAPTIVE SYSTEM)
========================= */
function applyProfile(profile) {
    if (!profile) return;

    userProfile = profile;

    // 🔥 IMPULSIVITY → más velocidad
    if (profile.impulsivity > 65) {
        state.spawnRate = 900;
        state.difficulty = 2;
    }

    // 🧘 CALM → más lento, más control
    if (profile.calm > 65) {
        state.spawnRate = 1600;
        state.difficulty = 1;
    }

    // 🎯 FOCUS → más precisión, menos caos
    if (profile.focus > 70) {
        state.spawnRate = 1800;
    }

    // ⚠️ FEAR → más presión emocional
    if (profile.fear > 65) {
        state.spawnRate = 1100;
    }
}

/* =========================
🔊 TEXT TO SPEECH
========================= */
function speak(t) {
    if (!t) return;
    let u = new SpeechSynthesisUtterance(t);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

/* =========================
📊 HUD UPDATE
========================= */
function updateHUD() {
    document.getElementById("score-box").innerText = state.score;

    let m = Math.floor(state.timer / 60);
    let s = state.timer % 60;
    document.getElementById("timer-box").innerText =
        String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

    for (let k in state.stats) {
        let el = document.getElementById("v-" + k);
        if (el) el.innerText = state.stats[k];
    }
}

/* =========================
🌊 WORD SYSTEM (ADAPTIVE)
========================= */
const words = {
    power: ["LISTEN FIRST", "CONTROL SELF", "THINK DEEP", "STAY CALM"],
    risk: ["REACT FAST", "IGNORE RULES", "LOSE CONTROL", "FOLLOW CROWD"],
    silence: ["OBSERVE", "BREATHE", "WAIT", "FOCUS"],
    money: ["SAVE", "INVEST", "BUILD", "GROW"],
    business: ["SYSTEM THINK", "LEAD", "CREATE VALUE", "SCALE"],
    growth: ["LEARN", "IMPROVE", "ADAPT", "DISCIPLINE"]
};

function spawnWord() {
    if (gameMode !== "words") return;

    const cats = ["power", "risk", "silence", "money", "business", "growth"];
    const c = cats[Math.floor(Math.random() * cats.length)];

    let div = document.createElement("div");
    div.className = "floating";
    div.innerText = words[c][Math.floor(Math.random() * words[c].length)];
    div.style.left = Math.random() * 80 + "vw";

    // 🎨 color logic
    if (c === "risk") div.style.border = "3px solid #ff003c";
    if (c === "power") div.style.border = "3px solid #00ff41";
    if (c === "silence") div.style.border = "3px solid #ffff00";
    if (c === "money") div.style.border = "3px solid #ffcc00";

    div.onclick = () => {
        if (div.dataset.clicked) return;
        div.dataset.clicked = true;

        div.classList.add("explode");

        AudioEngine.click();

        let positive = ["power", "silence", "money", "business", "growth"].includes(c);

        // 🧠 SCORE SYSTEM (ADAPTIVE IMPACT)
        state.score += positive ? 20 : -10;

        // 📊 STAT EVOLUTION
        if (c === "money") state.stats.money += 1;
        if (c === "business") state.stats.lead += 1;
        if (c === "growth") state.stats.happy += 1;
        if (c === "power") state.stats.respect += 1;
        if (c === "risk") state.stats.safety -= 1;
        if (c === "silence") state.stats.peace += 1;

        updateHUD();

        setTimeout(() => {
            div.remove();
        }, 500);
    };

    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 7000);
}

/* =========================
❓ QUESTION SYSTEM
========================= */
async function triggerQuestion() {

    const res = await fetch("/api/mission/next?lang=" + lang);
    const data = await res.json();

    if (!data || !data.options) return;

    // 🧬 APPLY ADAPTATION FROM BACKEND
    applyProfile(data.profile);

    let overlay = document.getElementById("overlay");
    let grid = document.getElementById("decision-grid");
    let desc = document.getElementById("phase-desc");
    let title = document.getElementById("phase-title");
    let cont = document.getElementById("continue-btn");

    overlay.style.display = "flex";
    grid.innerHTML = "";
    cont.style.display = "none";

    title.innerText = data.theme;
    desc.innerText = data.story;

    // 🫁 BREATH TRIGGERS
    if (desc.innerText.toLowerCase().includes("inhale")) {
        await breathing(18000, true);
    }

    if (desc.innerText.toLowerCase().includes("silence")) {
        await breathing(18000, false);
    }

    let answered = false;

    data.options.forEach(opt => {

        let btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = opt.text.en;

        btn.onclick = () => {
            AudioEngine.click();

            desc.innerText = opt.explanation.en;
            speak(opt.explanation.en);

            if (!answered) {
                answered = true;

                if (opt.correct) {
                    state.score += 30;
                    document.body.classList.add("correct-flash");
                } else {
                    state.score -= 20;
                    document.body.classList.add("wrong-flash");
                }

                setTimeout(() => {
                    document.body.classList.remove("correct-flash", "wrong-flash");
                }, 500);

                document.querySelectorAll(".choice-btn")
                    .forEach(b => b.classList.add("locked"));

                cont.style.display = "block";

                updateHUD();
            }
        };

        grid.appendChild(btn);
    });

    cont.onclick = () => {
        AudioEngine.click();
        overlay.style.display = "none";
    };
}

/* =========================
🫁 BREATHING SYSTEM
========================= */
async function breathing(duration = 18000, voice = true) {
    let c = document.getElementById("breath-circle");
    let desc = document.getElementById("phase-desc");

    c.style.display = "flex";

    let cycles = duration / 6000;

    for (let i = 0; i < cycles; i++) {

        c.innerText = "INHALE";
        if (voice) speak("inhale");
        await new Promise(r => setTimeout(r, 3000));

        c.innerText = "EXHALE";
        if (voice) speak("exhale");
        await new Promise(r => setTimeout(r, 3000));
    }

    c.style.display = "none";
}

/* =========================
⏱ TIMER
========================= */
setInterval(() => {
    if (state.timer > 0 && gameMode === "words") {
        state.timer--;
        updateHUD();
    }
}, 1000);

/* =========================
🔁 MAIN LOOP
========================= */
async function mainLoop() {

    while (true) {

        state.timer = 300;
        gameMode = "words";

        let end = Date.now() + 45000;

        while (Date.now() < end) {
            spawnWord();
            await new Promise(r => setTimeout(r, state.spawnRate));
        }

        document.querySelectorAll(".floating").forEach(e => e.remove());

        gameMode = "question";

        await triggerQuestion();

        await new Promise(r => setTimeout(r, 3000));
    }
}

/* =========================
🌐 LANGUAGE
========================= */
function toggleLang() {
    lang = (lang === "en") ? "es" : "en";
    document.getElementById("lang-btn").innerText = lang.toUpperCase();
}

/* =========================
🚀 START
========================= */
updateHUD();
mainLoop();
