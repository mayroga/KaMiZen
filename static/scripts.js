// static/scripts.js
const startBtn = document.getElementById("start-btn"); 
const nextBtn = document.getElementById("next-btn"); // Movido arriba
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let sessionBlocks = [];
let current = 0;

// Función para reproducir la voz del bloque
function playVoice(text) {
    return new Promise((resolve) => {
        speechSynthesis.cancel(); // detiene cualquier voz previa
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9; // velocidad de voz
        utterance.onend = resolve;
        speechSynthesis.speak(utterance);
    });
}

// Mostrar el bloque actual
async function showBlock(blockContent) {
    if (!blockContent) return;

    block.innerHTML = blockContent.text;
    document.body.style.backgroundColor = blockContent.color; // cambia color de fondo

    // Espera a que termine la voz
    await playVoice(blockContent.text);

    current++;
    if (current < sessionBlocks.length) {
        nextBtn.style.display = "inline-block"; // mostrar botón siguiente
    } else {
        nextBtn.style.display = "none";
        restartBtn.style.display = "inline-block"; // mostrar botón reiniciar al final
    }
}

// Evento de iniciar sesión
startBtn.addEventListener("click", async () => {
    try {
        startBtn.style.display = "none";
        const response = await fetch("/session_content");
        if (!response.ok) throw new Error("Error en servidor");
        const data = await response.json();

        // Convertimos la sesión en bloques para el frontend
        sessionBlocks = [
            { text: data.apertura, color: "#2563eb" },
            { text: data.historia, color: "#34d399" },
            { text: data.ejercicio, color: "#facc15" },
            { text: data.respiracion, color: "#60a5fa" },
            { text: data.visualizacion, color: "#a78bfa" },
            { text: data.cierre, color: "#f87171" }
        ];

        current = 0;
        await showBlock(sessionBlocks[0]);
    } catch (error) {
        console.error("Error:", error);
        block.innerText = "Error al cargar la sesión. Reintenta.";
        startBtn.style.display = "inline-block";
    }
});

// Botón siguiente
nextBtn.addEventListener("click", () => {
    nextBtn.style.display = "none";
    showBlock(sessionBlocks[current]);
});

// Botón reiniciar
restartBtn.addEventListener("click", () => location.reload());
