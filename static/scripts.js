const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;
let breathingInterval = null; // Para manejar animación respiratoria

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
    streakEl.innerHTML = "🔥 Racha: " + userData.streak + " días";
    levelEl.innerHTML = "Nivel KaMiZen: " + userData.nivel;
    discBar.style.width = userData.disciplina + "%";
    clarBar.style.width = userData.claridad + "%";
    calmBar.style.width = userData.calma + "%";
}
updatePanel();

/* RACHA DIARIA */
function updateStreak() {
    let today = new Date().toDateString();
    if (userData.lastDay !== today) {
        userData.streak += 1;
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
function breathingAnimation(duracion = 30) {
    // Limpiar cualquier animación previa
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
    }
    const existingCircle = document.querySelector(".breath-circle");
    if (existingCircle) existingCircle.remove();

    let circle = document.createElement("div");
    circle.className = "breath-circle";
    block.appendChild(circle);

    let inhale = true;
    breathingInterval = setInterval(() => {
        circle.style.transform = inhale ? "scale(1.6)" : "scale(1)";
        inhale = !inhale;
    }, 4000);

    // Detener después de la duración
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
        let btn = document.createElement("button");
        btn.innerText = op;
        btn.onclick = () => {
            if (i === b.correcta) {
                puntos += b.recompensa || 5;
                userData.disciplina += 2;
                userData.claridad += 2;
                alert("✅ Correcto: " + b.explicacion);
            } else {
                userData.calma += 1;
                alert("❌ Respuesta: " + b.explicacion);
            }
            updatePanel();
            nextBtn.style.display = "inline-block";
        };
        block.appendChild(btn);
    });
}

/* BLOQUE */
async function showBlock(b) {
    block.innerHTML = "";
    document.body.style.background = b.color || "#0f172a";

    // Texto o mensaje general
    if (b.texto) {
        block.innerHTML = "<p>" + b.texto + "</p>";
        await playVoice(b.texto);
    }

    switch (b.tipo) {
        case "quiz":
        case "acertijo":
        case "decision":
        case "juego_mental":
            block.innerHTML = "<h3>" + b.pregunta + "</h3>";
            createOptions(b);
            await playVoice(b.pregunta);
            break;

        case "respiracion":
            await playVoice(b.texto);
            breathingAnimation(b.duracion || 30);
            return; // El siguiente botón se activa al terminar respiración

        case "recompensa":
            userData.disciplina += 3;
            userData.claridad += 3;
            userData.calma += 3;
            block.innerHTML = "<h2>" + b.texto + "</h2>";
            await playVoice(b.texto);
            break;

        case "cierre":
            updateStreak();
            puntos += 10;
            if (puntos > 50) userData.nivel += 1;

            // Guardar sesión completada
            let completed = JSON.parse(localStorage.getItem("completedSessions")) || [];
            completed.push(currentSessionIndex);
            localStorage.setItem("completedSessions", JSON.stringify(completed));

            localStorage.setItem("kamizenData", JSON.stringify(userData));
            updatePanel();
            restartBtn.style.display = "inline-block";
            await playVoice(b.texto);
            return;

        case "visualizacion":
            await playVoice(b.texto);
            block.innerHTML = "<p>" + b.texto + "</p>";
            setTimeout(() => {
                nextBtn.style.display = "inline-block";
            }, 3000);
            break;

        case "historia":
        case "voz":
            // Bloques informativos solo muestran texto y voz
            await playVoice(b.texto);
            block.innerHTML = "<p>" + b.texto + "</p>";
            setTimeout(() => {
                nextBtn.style.display = "inline-block";
            }, 3000);
            break;

        default:
            // Bloque desconocido
            block.innerHTML = "<p>" + (b.texto || "Contenido desconocido") + "</p>";
            setTimeout(() => {
                nextBtn.style.display = "inline-block";
            }, 2000);
            break;
    }
    // Mostrar botón siguiente después de animación
    setTimeout(() => { nextBtn.style.display = "inline-block"; }, 4000);
}

/* SIGUIENTE BLOQUE */
function nextBlock() {
    nextBtn.style.display = "none";
    current++;
    if (current < bloques.length) {
        showBlock(bloques[current]);
    } else {
        restartBtn.style.display = "inline-block";
    }
}

/* INICIO SESIÓN */
let currentSessionIndex = 0;

startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";

    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        const sesiones = data.sesiones;

        // Recuperar sesiones completadas
        let completed = JSON.parse(localStorage.getItem("completedSessions")) || [];

        // Filtrar sesiones no completadas
        let availableIndices = sesiones.map((_, i) => i).filter(i => !completed.includes(i));

        if (availableIndices.length === 0) {
            // Reiniciar todas las sesiones si ya completó todas
            localStorage.removeItem("completedSessions");
            availableIndices = sesiones.map((_, i) => i);
        }

        // Elegir aleatoriamente una sesión disponible
        currentSessionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        bloques = sesiones[currentSessionIndex].bloques || [];
        current = 0;

        updateStreak();
        showBlock(bloques[0]);
    } catch (e) {
        block.innerHTML = "<p>Error cargando sesión.</p>";
        console.error(e);
    }
});

nextBtn.addEventListener("click", nextBlock);
restartBtn.addEventListener("click", () => location.reload());
