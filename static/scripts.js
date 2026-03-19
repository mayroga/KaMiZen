const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let sesionesFiles = ["kamizen_content_1.json","kamizen_content_2.json","kamizen_content_3.json","kamizen_content_4.json"];
let currentFileIdx = 0;
let currentSessionIdx = 0;
let bloques = [];
let currentBloque = 0;

/* DATOS USUARIO */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30
};

/* PANEL */
const streakEl = document.getElementById("streak");
const levelEl = document.getElementById("level");
const discBar = document.getElementById("disciplina-bar");
const clarBar = document.getElementById("claridad-bar");
const calmBar = document.getElementById("calma-bar");

function updatePanel() {
    streakEl.innerHTML = `🔥 Racha: ${userData.streak} días`;
    levelEl.innerHTML = `Nivel: ${userData.nivel}`;
    discBar.style.width = `${userData.disciplina}%`;
    clarBar.style.width = `${userData.claridad}%`;
    calmBar.style.width = `${userData.calma}%`;
}
updatePanel();

function updateStreak() {
    const today = new Date().toDateString();
    if (userData.lastDay !== today) {
        userData.streak++;
        userData.lastDay = today;
    }
}

/* VOZ */
function playVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* RESPIRACION */
let breathingInterval = null;
function breathingAnimation(duracion = 30) {
    if (breathingInterval) clearInterval(breathingInterval);
    const existingCircle = document.querySelector(".breath-circle");
    if (existingCircle) existingCircle.remove();

    const circle = document.createElement("div");
    circle.className = "breath-circle";
    block.appendChild(circle);

    let inhale = true;
    breathingInterval = setInterval(() => {
        circle.style.transform = inhale ? "scale(1.6)" : "scale(1)";
        inhale = !inhale;
    }, 4000);

    setTimeout(() => {
        clearInterval(breathingInterval);
        breathingInterval = null;
        circle.remove();
        nextBtn.style.display = "inline-block";
    }, duracion * 1000);
}

/* OPCIONES */
function createOptions(b) {
    b.opciones.forEach((op, i) => {
        const btn = document.createElement("button");
        btn.innerText = op;
        btn.onclick = () => {
            if (i === b.correcta) {
                userData.disciplina += 2;
                userData.claridad += 2;
                alert(`✅ Correcto: ${b.explicacion}`);
            } else {
                userData.calma += 1;
                alert(`❌ Respuesta: ${b.explicacion}`);
            }
            updatePanel();
            nextBtn.style.display = "inline-block";
        };
        block.appendChild(btn);
    });
}

/* MOSTRAR BLOQUE */
async function showBlock(b) {
    if (!b) {
        block.innerHTML = "<p>⚠️ Bloque vacío o inexistente</p>";
        restartBtn.style.display = "inline-block";
        return;
    }

    block.innerHTML = "";
    document.body.style.background = b.color || "#0f172a";

    if (b.texto) await playVoice(b.texto);

    switch (b.tipo) {
        case "quiz":
        case "decision":
        case "juego_mental":
            if (!b.pregunta || !b.opciones) break;
            block.innerHTML = `<h3>${b.pregunta}</h3>`;
            createOptions(b);
            await playVoice(b.pregunta);
            break;

        case "respiracion":
            await playVoice(b.texto);
            breathingAnimation(b.duracion || 30);
            return;

        case "recompensa":
            userData.disciplina += 3;
            userData.claridad += 3;
            userData.calma += 3;
            block.innerHTML = `<h2>${b.texto}</h2>`;
            await playVoice(b.texto);
            break;

        case "cierre":
            updateStreak();
            let completed = JSON.parse(localStorage.getItem("completedSessions")) || [];
            completed.push(`${currentFileIdx}_${currentSessionIdx}`);
            localStorage.setItem("completedSessions", JSON.stringify(completed));
            localStorage.setItem("kamizenData", JSON.stringify(userData));
            updatePanel();
            restartBtn.style.display = "inline-block";
            await playVoice(b.texto);
            return;

        default:
            block.innerHTML = `<p>${b.texto || "Contenido desconocido"}</p>`;
            setTimeout(() => nextBtn.style.display = "inline-block", 2000);
            break;
    }
}

/* SIGUIENTE BLOQUE */
function nextBlock() {
    nextBtn.style.display = "none";
    currentBloque++;
    if (currentBloque < bloques.length) {
        showBlock(bloques[currentBloque]);
    } else {
        loadNextSession();
    }
}

/* ANTERIOR BLOQUE */
function prevBlock() {
    prevBtn.style.display = "none";
    if (currentBloque > 0) {
        currentBloque--;
        showBlock(bloques[currentBloque]);
    }
}

/* CARGAR SESION */
async function loadSession(fileIdx, sessionIdx) {
    block.innerHTML = "Cargando sesión...";
    try {
        const res = await fetch(`/session_content?file_idx=${fileIdx}&sesion_idx=${sessionIdx}`);
        const data = await res.json();
        bloques = data.bloques || [];
        currentBloque = 0;
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        restartBtn.style.display = "none";
        if (bloques.length === 0) block.innerHTML = "<p>⚠️ Sesión vacía</p>";
        else showBlock(bloques[0]);
    } catch(e) {
        console.error(e);
        block.innerHTML = "<p>❌ Error cargando sesión</p>";
    }
}

/* PASAR A SIGUIENTE SESION */
function loadNextSession() {
    currentSessionIdx++;
    if (currentSessionIdx >= 10) { // cada JSON tiene 10 sesiones salvo el último
        currentSessionIdx = 0;
        currentFileIdx++;
        if (currentFileIdx >= sesionesFiles.length) currentFileIdx = 0;
    }
    loadSession(currentFileIdx, currentSessionIdx);
}

/* INICIO */
startBtn.addEventListener("click", () => {
    startBtn.style.display = "none";
    currentFileIdx = 0;
    currentSessionIdx = 0;
    loadSession(currentFileIdx, currentSessionIdx);
});

nextBtn.addEventListener("click", nextBlock);
prevBtn.addEventListener("click", prevBlock);
restartBtn.addEventListener("click", () => location.reload());
