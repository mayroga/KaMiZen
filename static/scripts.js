/* =================== KA MIZEN GLOBAL STATE =================== */

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let isBreathing = false;

let currentLang = localStorage.getItem("kamizenLang") || "en";

/* =================== TRANSLATIONS =================== */

const translations = {
    en: {
        start: "Start Session",
        next: "Next",
        back: "Back",
        forward: "Forward",
        restart: "Restart"
    },
    es: {
        start: "Iniciar sesión",
        next: "Siguiente",
        back: "Atrás",
        forward: "Adelantar",
        restart: "Reiniciar"
    }
};

/* =================== USER DATA =================== */

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    level: 1,
    discipline: 40,
    clarity: 50,
    calm: 30
};

let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

/* =================== PANEL =================== */

function updatePanel() {
    document.getElementById("streak").innerHTML = `🔥 Streak: ${userData.streak} days`;
    document.getElementById("level").innerHTML = `KaMiZen Level: ${userData.level}`;

    document.getElementById("disciplina-bar").style.width = (userData.discipline || 0) + "%";
    document.getElementById("claridad-bar").style.width = (userData.clarity || 0) + "%";
    document.getElementById("calma-bar").style.width = (userData.calm || 0) + "%";

    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

/* =================== LANGUAGE UI =================== */

function updateLanguageUI() {
    startBtn.innerText = translations[currentLang].start;
    nextBtn.innerText = translations[currentLang].next;
    backBtn.innerText = translations[currentLang].back;
    forwardBtn.innerText = translations[currentLang].forward;
    restartBtn.innerText = translations[currentLang].restart;
}

/* =================== VOICE ENGINE =================== */

function playVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();

        const msg = new SpeechSynthesisUtterance(text);

        msg.lang = currentLang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.85;

        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== PENALTY SYSTEM =================== */

function applyPenalty() {
    userData.calm = Math.max(0, userData.calm * 0.8);
    userData.discipline = Math.max(0, userData.discipline * 0.8);
    userData.clarity = Math.max(0, userData.clarity * 0.9);

    updatePanel();
}

/* =================== BLOCK RENDER =================== */

async function showBlock(b) {

    block.innerHTML = "";
    nextBtn.style.display = "none";

    document.body.style.background = b.color || "#070b14";

    /* FIX: VOICE / STORY / STRATEGY */
    if (["voice", "tvid", "strategy", "story", "visualization", "reward", "closing"].includes(b.type)) {

        const text = b.text || "";

        block.innerHTML = `<div style="text-align:center;font-size:1.4em">${text}</div>`;

        await playVoice(text);

        if (b.type === "reward") {
            userData.discipline += b.points || 10;
            updatePanel();
        }

        setTimeout(() => {
            nextBtn.style.display = "inline-block";
        }, 800);

        return;
    }

    /* BREATHING */
    if (b.type === "breathing") {

        block.innerHTML = `<div style="font-size:1.6em;text-align:center">${b.text}</div>`;

        await playVoice(b.text);

        setTimeout(() => {
            nextBtn.style.display = "inline-block";
        }, (b.duration || 6) * 1000);

        return;
    }

    /* QUIZ / GAME */
    if (["quiz", "mental_game", "decision"].includes(b.type)) {

        const question = b.question;

        block.innerHTML = `<h3>${question}</h3>`;

        await playVoice(question);

        b.options.forEach((op, i) => {

            const btn = document.createElement("button");
            btn.innerText = op;

            btn.onclick = async () => {

                const correct = i === b.correct;

                const msg = correct ? "Correct" : "Wrong";

                await playVoice(msg);

                if (correct) {
                    userData.discipline += b.reward || 5;
                    updatePanel();
                    nextBtn.style.display = "inline-block";
                } else {
                    userData.calm += 2;
                    updatePanel();
                }
            };

            block.appendChild(btn);
        });

        return;
    }

    /* CLOSE */
    if (b.type === "closing") {

        block.innerHTML = `<div style="font-size:1.6em;text-align:center">${b.text}</div>`;

        await playVoice(b.text);

        restartBtn.style.display = "inline-block";
    }
}

/* =================== START SESSION =================== */

let currentSessionIndex = 0;

startBtn.addEventListener("click", async () => {

    startBtn.style.display = "none";

    const res = await fetch("/session_content");
    const data = await res.json();

    const sessions = data.sessions;

    currentSessionIndex = Math.floor(Math.random() * sessions.length);

    bloques = sessions[currentSessionIndex].blocks;

    current = 0;

    showBlock(bloques[0]);
});

/* =================== NAVIGATION =================== */

nextBtn.onclick = () => {
    current++;
    if (current < bloques.length) showBlock(bloques[current]);
};

backBtn.onclick = () => {
    if (current > 0) {
        applyPenalty();
        current--;
        showBlock(bloques[current]);
    }
};

forwardBtn.onclick = () => {
    if (current < bloques.length - 1) {
        applyPenalty();
        current++;
        showBlock(bloques[current]);
    }
};

restartBtn.onclick = () => location.reload();

/* =================== LANGUAGE SWITCH =================== */

document.getElementById("lang-btn").addEventListener("click", () => {
    currentLang = currentLang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", currentLang);
    updateLanguageUI();
});

/* INIT */
updatePanel();
updateLanguageUI();
