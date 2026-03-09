const startBtn = document.getElementById("start-btn");
const block = document.getElementById("block");

let sessionBlocks = [];
let current = 0;

// Función para leer en voz alta
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
}

// Función para mostrar siguiente bloque
function nextBlock() {
    if (current < sessionBlocks.length) {
        block.innerText = sessionBlocks[current];
        speak(sessionBlocks[current]);
        current++;
        // Avanza cada 2 minutos (120000 ms) para simular 10 minutos de sesión
        if (current < sessionBlocks.length) {
            setTimeout(nextBlock, 120000);
        } else {
            setTimeout(() => {
                block.innerText = "Sesión finalizada. Gracias por participar.";
                speak("Sesión finalizada. Gracias por participar.");
            }, 2000);
        }
    }
}

// Iniciar sesión
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const response = await fetch("/session_content");
    const data = await response.json();

    sessionBlocks = [
        "Historia de Poder:\n" + data.historia,
        "Historia de Riqueza:\n" + data.historia_riqueza,
        "Ejercicio Mental:\n" + data.ejercicio,
        "Consejo de Bienestar:\n" + data.bienestar,
        "Cierre Motivacional:\n" + data.cierre
    ];

    nextBlock();
});
