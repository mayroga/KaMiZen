let state = {
    score: 0,
    lang: "en",
    missionId: 1,
    mission: null,
    silence: 180
};

let player = { name: "", hero: "" };

// ================= AUDIO =================
let bg, ok, bad;

function initAudio() {
    bg = document.getElementById("bg");
    ok = document.getElementById("ok");
    bad = document.getElementById("bad");

    if (bg) {
        bg.volume = 0.3;
        bg.playbackRate = 1.1;
        bg.play().catch(()=>{});
    }
}

// ================= SPEECH =================
function speak(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = state.lang === "en" ? "en-US" : "es-ES";
    u.rate = 0.9;
    speechSynthesis.speak(u);
}

// ================= UI =================
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}

function updateScore() {
    setText("score-display", "PUNTOS: " + state.score);
}

// ================= INIT =================
async function init() {
    player.name = prompt("Nombre:") || "Player";
    player.hero = prompt("Heroe:") || "Kamizen";

    document.getElementById("hero-name").innerText = player.hero;

    initAudio();
    startFloatingSystem();
    loadMission();
}

// ================= MISIONES =================
async function loadMission() {
    const res = await fetch("/api/mission/" + state.missionId);
    state.mission = await res.json();

    renderMission(state.mission);
}

function renderMission(m) {
    const story = m.blocks.find(b => b.type === "story").text[state.lang];
    const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
    const decision = m.blocks.find(b => b.type === "decision");

    setText("story", story);
    setText("analysis", "");

    speak(story);

    setTimeout(() => {
        setText("analysis", analysis);
        speak(analysis);
    }, 3500);

    setTimeout(() => {
        renderOptions(decision.options);
    }, 7000);
}

// ================= OPCIONES =================
function renderOptions(options) {
    const c = document.getElementById("options");
    c.innerHTML = "";

    options.forEach(opt => {
        const b = document.createElement("button");
        b.className = "opt-btn";
        b.innerText = opt.text[state.lang];
        b.onclick = function () {
            handleChoice(opt);
        };
        c.appendChild(b);
    });
}

function handleChoice(option) {
    document.getElementById("options").innerHTML = "";

    const box = document.getElementById("explanation-box");
    box.style.display = "block";
    box.innerText = option.explanation[state.lang];

    if (option.correct) {
        state.score += 20;
        document.body.style.background = "#004400";
        ok && ok.play();
        speak("Correcto. " + box.innerText);
    } else {
        state.score -= 10;
        document.body.style.background = "#440000";
        bad && bad.play();
        speak("Incorrecto. " + box.innerText);
    }

    updateScore();

    setTimeout(() => {
        document.body.style.background = "";
        nextMission();
    }, 4000);
}

// ================= FLUJO =================
function nextMission() {
    state.missionId++;
    if (state.missionId > 35) state.missionId = 1;
    loadMission();
}

// ================= FLOATING SYSTEM =================
function startFloatingSystem() {
    setInterval(() => {

        const types = ["good", "bad", "neutral"];
        const type = types[Math.random() * types.length | 0];

        const words = {
            good: ["POWER", "TRUTH", "FOCUS", "CONTROL"],
            bad: ["FEAR", "LIE", "ANGER", "LAZY"],
            neutral: ["STREET", "WALK", "CITY", "WAIT"]
        };

        const el = document.createElement("div");
        el.className = "floating word-" + type;
        el.innerText = words[type][Math.random() * words[type].length | 0];
        el.style.left = Math.random() * 90 + "vw";

        el.onmousedown = function () {
            el.classList.add("blast");

            if (type === "good") state.score += 5;
            if (type === "bad") state.score -= 10;

            updateScore();
            el.remove();
        };

        document.body.appendChild(el);

        setTimeout(() => {
            el.remove();
        }, 5000);

    }, 2000);
}

// ================= LANG =================
function toggleLang() {
    state.lang = state.lang === "en" ? "es" : "en";
    if (state.mission) renderMission(state.mission);
}

// ================= EXPORT GLOBAL =================
window.onload = init;
