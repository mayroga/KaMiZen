const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let currentSessionId = 1;

/* PERSISTENCIA DE DATOS */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1,
    disciplina: 30, claridad: 30, calma: 30,
    lastSessionId: 0
};

function updatePanel() {
    document.getElementById("streak").innerText = `🔥 Racha: ${userData.streak} días`;
    document.getElementById("level").innerText = `Nivel KaMiZen: ${userData.nivel}`;
    document.getElementById("disciplina-bar").style.width = `${userData.disciplina}%`;
    document.getElementById("claridad-bar").style.width = `${userData.claridad}%`;
    document.getElementById("calma-bar").style.width = `${userData.calma}%`;
}
updatePanel();

/* MOTOR DE VOZ */
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

/* ANIMACIÓN RESPIRACIÓN AL COMPÁS */
function startBreathing(duracion) {
    const circle = document.createElement("div");
    circle.className = "breath-circle";
    block.appendChild(circle);

    let inhale = true;
    // El compás es de 4 segundos por fase
    const interval = setInterval(() => {
        if (!document.querySelector(".breath-circle")) {
            clearInterval(interval);
            return;
        }
        circle.style.transform = inhale ? "scale(1.8)" : "scale(1)";
        inhale = !inhale;
    }, 4000);

    // Detener después del tiempo del JSON
    setTimeout(() => {
        clearInterval(interval);
        nextBtn.style.display = "block";
    }, duracion * 1000);
}

/* RENDERIZADO DE BLOQUES */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";
    if (b.color) document.body.style.background = b.color;

    if (b.tipo === "respiracion") {
        block.innerHTML = `<p>${b.texto}</p>`;
        playVoice(b.texto);
        startBreathing(b.duracion || 30);
    } 
    else if (b.pregunta) {
        block.innerHTML = `<h3>${b.pregunta}</h3>`;
        playVoice(b.pregunta);
        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.innerText = op;
            btn.onclick = () => {
                alert(i === b.correcta ? "Correcto: " + b.explicacion : "Respuesta: " + b.explicacion);
                nextBtn.style.display = "block";
            };
            block.appendChild(btn);
        });
    } 
    else {
        block.innerHTML = `<p>${b.texto || ""}</p>`;
        if (b.texto) await playVoice(b.texto);
        
        if (b.tipo === "cierre") {
            userData.lastSessionId = currentSessionId;
            localStorage.setItem("kamizenData", JSON.stringify(userData));
            restartBtn.style.display = "block";
        } else {
            setTimeout(() => { nextBtn.style.display = "block"; }, 3000);
        }
    }
}

/* INICIO Y CONTROL DE FLUJO */
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    
    // Ordenar por ID y buscar la siguiente sesión
    let sesiones = data.sesiones.sort((a, b) => a.id - b.id);
    currentSessionId = userData.lastSessionId + 1;
    
    let sesionActual = sesiones.find(s => s.id === currentSessionId);
    if (!sesionActual) {
        currentSessionId = 1; // Reiniciar ciclo tras la sesión 40
        sesionActual = sesiones[0];
    }

    bloques = sesionActual.bloques;
    current = 0;
    showBlock(bloques[current]);
});

nextBtn.addEventListener("click", () => {
    current++;
    if (current < bloques.length) showBlock(bloques[current]);
});

restartBtn.addEventListener("click", () => location.reload());
