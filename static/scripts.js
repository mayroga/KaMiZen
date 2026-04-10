/* =================== KA MIZEN GLOBAL STATE =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const block = document.getElementById("block");
const langBtn = document.getElementById("lang-btn");

let bloques = [];
let current = 0;
let currentLang = localStorage.getItem("kamizenLang") || "en";

/* =================== AUDIO ENGINE =================== */
const bgMusic = new Audio();
bgMusic.loop = true;

const musicTracks = {
    1: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    2: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    3: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
};

function updateMusic(level) {
    const track = musicTracks[level] || musicTracks[1];
    if (bgMusic.src !== track) {
        bgMusic.src = track;
        bgMusic.volume = 0.4;
        bgMusic.play().catch(e => console.log("Click start to play music"));
    }
}

/* =================== BACKGROUND ZOOM (KEN BURNS) =================== */
const bgImages = [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1920",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920",
    "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1920"
];

function initBackground() {
    let idx = 0;
    const changeBg = () => {
        document.body.style.backgroundImage = `url(${bgImages[idx]})`;
        document.body.style.backgroundSize = "110%";
        setTimeout(() => { document.body.style.backgroundSize = "130%"; }, 100);
        idx = (idx + 1) % bgImages.length;
    };
    changeBg();
    setInterval(changeBg, 10000);
}

/* =================== VOICE ENGINE =================== */
async function playVoice(text) {
    return new Promise(resolve => {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = currentLang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        window.speechSynthesis.speak(msg);
    });
}

/* =================== RENDERER =================== */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";

    const content = typeof b.text === "object" ? b.text[currentLang] : b.text;

    if (["voice", "strategy", "story", "reward"].includes(b.type)) {
        block.innerHTML = `<div>${content}</div>`;
        await playVoice(content);
        nextBtn.style.display = "block";
    }

    if (b.type === "quiz") {
        const question = b.question[currentLang];
        const options = b.options[currentLang];
        block.innerHTML = `<h3 style="margin-bottom:20px;">${question}</h3>`;
        await playVoice(question);

        options.forEach((op, i) => {
            const btn = document.createElement("button");
            btn.innerText = op;
            btn.className = "secondary";
            btn.onclick = async () => {
                if (i === b.correct) {
                    await playVoice(currentLang === "en" ? "Correct" : "Correcto");
                    nextBtn.style.display = "block";
                } else {
                    await playVoice(currentLang === "en" ? "Try again" : "Intenta de nuevo");
                }
            };
            block.appendChild(btn);
        });
    }

    if (b.type === "t_vid_part") {
        const goal = b.goal[currentLang];
        const guides = b.voice_guidance[currentLang];
        block.innerHTML = `<h2 style="color:#60a5fa">${goal}</h2>`;
        for (const m of guides) { await playVoice(m); }
        nextBtn.style.display = "block";
    }
}

/* =================== EVENTS =================== */
startBtn.onclick = async () => {
    startBtn.style.display = "none";
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        const session = data.sessions[Math.floor(Math.random() * data.sessions.length)];
        
        updateMusic(session.level);
        bloques = session.blocks;
        current = 0;
        showBlock(bloques[0]);
    } catch (e) {
        block.innerText = "Error loading content.";
    }
};

nextBtn.onclick = () => {
    current++;
    if (current < bloques.length) showBlock(bloques[current]);
    else {
        block.innerHTML = "<h2>Session Complete</h2>";
        startBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
};

langBtn.onclick = () => {
    currentLang = currentLang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", currentLang);
    langBtn.innerText = currentLang.toUpperCase();
    location.reload();
};

initBackground();
document.getElementById("streak").innerText = `🔥 Streak: 1`;
