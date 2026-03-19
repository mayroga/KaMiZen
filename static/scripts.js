const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let currentFileIdx = 0;
let currentSessionIdx = 0;
let bloques = [];
let currentBloque = 0;

const MAX_SESSIONS_PER_FILE = 10;

// =========================
// USER DATA
// =========================

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30
};

function saveUser() {
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

// =========================
// VOZ
// =========================

function playVoice(text) {

    return new Promise(resolve => {

        speechSynthesis.cancel();

        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;

        msg.onend = () => {
            resolve();
        };

        speechSynthesis.speak(msg);

    });

}

// =========================
// RESPIRACION
// =========================

let breathingInterval = null;

function breathingAnimation(duracion = 30) {

    if (breathingInterval) clearInterval(breathingInterval);

    const circle = document.createElement("div");
    circle.className = "breath-circle";

    block.innerHTML = "";
    block.appendChild(circle);

    let inhale = true;

    breathingInterval = setInterval(() => {

        circle.style.transform =
            inhale ? "scale(1.6)" : "scale(1)";

        inhale = !inhale;

    }, 4000);

    setTimeout(() => {

        clearInterval(breathingInterval);

        nextBtn.style.display = "inline-block";

    }, duracion * 1000);

}

// =========================
// OPCIONES
// =========================

function createOptions(b) {

    b.opciones.forEach((op, i) => {

        const btn = document.createElement("button");

        btn.innerText = op;

        btn.onclick = () => {

            if (i === b.correcta) {

                userData.disciplina += 2;
                userData.claridad += 2;

            } else {

                userData.calma += 1;

            }

            saveUser();

            nextBtn.style.display = "inline-block";

        };

        block.appendChild(btn);

    });

}

// =========================
// MOSTRAR BLOQUE
// =========================

async function showBlock(b) {

    if (!b) {

        block.innerHTML = "⚠️ Bloque vacío";
        restartBtn.style.display = "inline-block";
        return;

    }

    block.innerHTML = "";

    nextBtn.style.display = "none";
    prevBtn.style.display = "none";
    restartBtn.style.display = "none";

    if (b.color) {

        document.body.style.background = b.color;

    }

    // =========================
    // TEXTO NORMAL
    // =========================

    if (!b.tipo) {

        block.innerHTML = b.texto || "Contenido desconocido";

        await playVoice(b.texto || "");

        nextBtn.style.display = "inline-block";

        return;

    }

    // =========================
    // QUIZ / DECISION / JUEGO
    // =========================

    if (
        b.tipo === "quiz" ||
        b.tipo === "decision" ||
        b.tipo === "juego_mental"
    ) {

        block.innerHTML = `<h3>${b.pregunta}</h3>`;

        await playVoice(b.pregunta);

        createOptions(b);

        return;

    }

    // =========================
    // RESPIRACION (TVid)
    // =========================

    if (b.tipo === "respiracion") {

        await playVoice(b.texto || "");

        breathingAnimation(b.duracion || 20);

        return;

    }

    // =========================
    // RECOMPENSA
    // =========================

    if (b.tipo === "recompensa") {

        userData.disciplina += 3;
        userData.claridad += 3;
        userData.calma += 3;

        saveUser();

        block.innerHTML = b.texto;

        await playVoice(b.texto);

        nextBtn.style.display = "inline-block";

        return;

    }

    // =========================
    // CIERRE
    // =========================

    if (b.tipo === "cierre") {

        block.innerHTML = b.texto;

        await playVoice(b.texto);

        restartBtn.style.display = "inline-block";

        return;

    }

    // =========================
    // DEFAULT
    // =========================

    block.innerHTML = b.texto || "Contenido desconocido";

    await playVoice(b.texto || "");

    nextBtn.style.display = "inline-block";

}

// =========================
// NEXT BLOQUE
// =========================

function nextBlock() {

    currentBloque++;

    if (currentBloque < bloques.length) {

        showBlock(bloques[currentBloque]);

    } else {

        loadNextSession();

    }

}

// =========================
// NEXT SESSION
// =========================

function loadNextSession() {

    currentSessionIdx++;

    if (currentSessionIdx >= MAX_SESSIONS_PER_FILE) {

        currentSessionIdx = 0;
        currentFileIdx++;

    }

    loadSession(currentFileIdx, currentSessionIdx);

}

// =========================
// LOAD SESSION
// =========================

async function loadSession(fileIdx, sessionIdx) {

    block.innerHTML = "Cargando sesión...";

    try {

        const res = await fetch(
            `/session_content?file_idx=${fileIdx}&sesion_idx=${sessionIdx}`
        );

        const data = await res.json();

        bloques = data.bloques || [];

        currentBloque = 0;

        if (bloques.length === 0) {

            block.innerHTML = "⚠️ No hay bloques";

            return;

        }

        showBlock(bloques[0]);

    } catch (e) {

        block.innerHTML = "❌ Error cargando sesión";

    }

}

// =========================
// BOTONES
// =========================

startBtn.onclick = () => {

    startBtn.style.display = "none";

    currentFileIdx = 0;
    currentSessionIdx = 0;

    loadSession(0, 0);

};

nextBtn.onclick = nextBlock;

restartBtn.onclick = () => {

    location.reload();

};
