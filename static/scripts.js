const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;
let currentSessionId = 1; 

/* DATOS USUARIO */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30,
    lastSessionId: 0 // Seguimiento de última sesión completada
};

const streakEl = document.getElementById("streak");
const levelEl = document.getElementById("level");
const discBar = document.getElementById("disciplina-bar");
const clarBar = document.getElementById("claridad-bar");
const calmBar = document.getElementById("calma-bar");

function updatePanel(){
    streakEl.innerHTML = "🔥 Racha: " + userData.streak + " días";
    levelEl.innerHTML = "Nivel KaMiZen: " + userData.nivel;
    discBar.style.width = userData.disciplina + "%";
    clarBar.style.width = userData.claridad + "%";
    calmBar.style.width = userData.calma + "%";
}
updatePanel();

function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.95;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

function breathingAnimation(duration){
    block.innerHTML += '<div class="breath-circle"></div>';
    let inhale = true;
    const interval = setInterval(() => {
        const circle = document.querySelector(".breath-circle");
        if(circle) circle.style.transform = inhale ? "scale(1.6)" : "scale(1)";
        inhale = !inhale;
    }, 4000);
    setTimeout(() => clearInterval(interval), duration * 1000);
}

async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#0f172a";

    if(b.texto) {
        block.innerHTML = `<p>${b.texto}</p>`;
        await playVoice(b.texto);
    }

    switch(b.tipo){
        case "quiz":
        case "acertijo":
        case "decision":
        case "juego_mental":
            block.innerHTML = `<h3>${b.pregunta}</h3>`;
            b.opciones.forEach((op, i) => {
                let btn = document.createElement("button");
                btn.innerText = op;
                btn.onclick = () => {
                    alert(i === b.correcta ? "Correcto: " + b.explicacion : "Respuesta: " + b.explicacion);
                    nextBtn.style.display = "inline-block";
                };
                block.appendChild(btn);
            });
            await playVoice(b.pregunta);
            break;
        case "respiracion":
            breathingAnimation(b.duracion || 30);
            setTimeout(() => { nextBtn.style.display = "inline-block"; }, 10000);
            break;
        case "recompensa":
            block.innerHTML = `<h2>${b.texto}</h2>`;
            await playVoice(b.texto);
            setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
            break;
        case "cierre":
            userData.lastSessionId = currentSessionId;
            localStorage.setItem("kamizenData", JSON.stringify(userData));
            block.innerHTML = `<h2>${b.texto}</h2>`;
            await playVoice(b.texto);
            restartBtn.style.display = "inline-block";
            break;
    }
}

startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    let sesiones = data.sesiones.sort((a, b) => a.id - b.id);

    // Lógica Secuencial: Siguiente ID o reiniciar ciclo
    currentSessionId = userData.lastSessionId + 1;
    let sesionActual = sesiones.find(s => s.id === currentSessionId);

    if(!sesionActual) {
        currentSessionId = 1; // Reiniciar ciclo
        sesionActual = sesiones[0];
    }

    bloques = sesionActual.bloques;
    current = 0;
    showBlock(bloques[0]);
});

nextBtn.addEventListener("click", () => {
    nextBtn.style.display = "none";
    current++;
    if(current < bloques.length) showBlock(bloques[current]);
});

restartBtn.addEventListener("click", () => location.reload());
