const startBtn = document.getElementById("start-btn");
const block = document.getElementById("block");
const restartBtn = document.getElementById("restart-btn");

let sessionBlocks = [];
let current = 0;

// Función de voz con pausa automática
function playVoice(text) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.onend = resolve;
        speechSynthesis.speak(utterance);
    });
}

// Mostrar bloque
async function showBlock(blockContent) {
    block.innerHTML = blockContent.text;
    document.body.style.background = blockContent.color; // cambia color

    // Espera la voz
    await playVoice(blockContent.text);

    // Si hay interacción (ejercicio con respuesta)
    if (blockContent.tipo === "ejercicio") {
        const answerBtn = document.createElement("button");
        answerBtn.innerText = "Mostrar Respuesta";
        answerBtn.onclick = () => alert(blockContent.respuesta || "No hay respuesta");
        block.appendChild(answerBtn);
    }

    current++;
    if (current < sessionBlocks.length) {
        nextBtn.style.display = "inline-block"; // botón siguiente
    } else {
        restartBtn.style.display = "inline-block";
    }
}

// Botón iniciar
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const response = await fetch("/session_content");
    const data = await response.json();

    sessionBlocks = [
        { text: data.apertura, color: "#2563eb", tipo: "apertura" },
        { text: data.historia, color: "#34d399", tipo: "historia" },
        { text: data.ejercicio, color: "#facc15", tipo: "ejercicio", respuesta: "La respuesta depende de tus cálculos." },
        { text: data.respiracion, color: "#60a5fa", tipo: "respiracion" },
        { text: data.visualizacion, color: "#a78bfa", tipo: "visualizacion" },
        { text: data.cierre, color: "#f87171", tipo: "cierre" }
    ];

    current = 0;
    showBlock(sessionBlocks[0]);
});

// Botón reiniciar
restartBtn.addEventListener("click", () => location.reload());

// Botón siguiente
const nextBtn = document.getElementById("next-btn");
nextBtn.addEventListener("click", () => {
    nextBtn.style.display = "none";
    showBlock(sessionBlocks[current]);
});
