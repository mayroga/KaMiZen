const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;
let currentSessionIndex = 0;

/* PERSISTENCIA PROFESIONAL */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 50,
    claridad: 50,
    calma: 50
};

function updatePanel(){
    document.getElementById("streak").innerHTML = "🔥 Racha: " + userData.streak + " días";
    document.getElementById("level").innerHTML = "Nivel KaMiZen: " + userData.nivel;
    document.getElementById("disciplina-bar").style.width = userData.disciplina + "%";
    document.getElementById("claridad-bar").style.width = userData.claridad + "%";
    document.getElementById("calma-bar").style.width = userData.calma + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

/* EL ARMA DE VOZ: COOPERATIVA Y POTENTE */
function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-US";
        msg.rate = 0.95;
        msg.pitch = 1.0;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
        setTimeout(resolve, text.length * 85); // Seguro por si falla onend
    });
}

async function showBlock(b){
    block.innerHTML = "";
    nextBtn.style.display = "none";
    document.body.style.background = b.color || "#020617";

    // 1. Mostrar texto principal y hablarlo
    if(b.texto) {
        block.innerHTML = `<p>${b.texto}</p>`;
        await playVoice(b.texto);
    }

    // 2. Lógica por tipo de bloque
    switch(b.tipo){
        case "quiz":
        case "decision":
        case "juego_mental":
            block.innerHTML += `<h3>${b.pregunta}</h3>`;
            await playVoice(b.pregunta);
            createOptions(b);
            break;

        case "respiracion":
            let circle = document.createElement("div");
            circle.className = "breath-circle";
            block.appendChild(circle);
            await playVoice("Inhala calma, exhala debilidad.");
            setTimeout(() => { circle.style.transform = "scale(1.7)"; }, 100);
            setTimeout(() => { 
                circle.style.transform = "scale(1)"; 
                nextBtn.style.display = "block";
            }, 8000);
            break;

        case "cierre":
            userData.streak += 1;
            userData.nivel += 1;
            block.innerHTML = `<h3>SABIDURÍA ALCANZADA</h3><p>${b.texto}</p>`;
            await playVoice(b.texto);
            await playVoice("Felicidades. Has aumentado tu nivel de consciencia.");
            restartBtn.style.display = "block";
            updatePanel();
            break;
    }
}

function createOptions(b){
    b.opciones.forEach((op, i) => {
        let btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = op;
        btn.onclick = async () => {
            const esCorrecto = (i === b.correcta);
            
            // Lógica de coaching: Explicar SIEMPRE por qué
            const feedback = esCorrecto 
                ? `CORRECTO. ${b.explicacion}` 
                : `PIENSA MEJOR. La respuesta acertada era: ${b.opciones[b.correcta]}. ${b.explicacion}`;
            
            block.innerHTML = `<h3>${esCorrecto ? '¡ÉXITO!' : 'APRENDIZAJE'}</h3><p>${feedback}</p>`;
            
            // Subir o bajar niveles (Línea verde)
            if(esCorrecto){
                userData.disciplina = Math.min(100, userData.disciplina + 5);
                userData.claridad = Math.min(100, userData.claridad + 5);
            } else {
                userData.disciplina = Math.max(0, userData.disciplina - 3);
                userData.calma = Math.min(100, userData.calma + 2);
            }
            
            updatePanel();
            await playVoice(feedback);
            nextBtn.style.display = "block";
        };
        block.appendChild(btn);
    });
}

startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    const sesiones = data.sesiones;
    
    // Selección inteligente: Aleatoria de las 70 disponibles
    currentSessionIndex = Math.floor(Math.random() * sesiones.length);
    bloques = sesiones[currentSessionIndex].bloques;
    current = 0;
    
    showBlock(bloques[0]);
});

nextBtn.onclick = () => {
    current++;
    if(current < bloques.length) showBlock(bloques[current]);
};

restartBtn.onclick = () => location.reload();

updatePanel();
