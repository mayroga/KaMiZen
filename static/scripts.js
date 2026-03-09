const startBtn = document.getElementById("start-btn");
const nextBtn = document.createElement("button");
const restartBtn = document.createElement("button");
const block = document.getElementById("block");
const contentBox = document.getElementById("content-box");

let sessionBlocks = [];
let current = 0;
let colors = ["#1e3a8a", "#2563eb", "#7dd3fc", "#facc15", "#dc2626", "#16a34a"];

nextBtn.innerText = "Siguiente";
restartBtn.innerText = "Reiniciar Sesión";
nextBtn.style.marginTop = "20px";
restartBtn.style.marginTop = "10px";
nextBtn.style.padding = restartBtn.style.padding = "10px 20px";
nextBtn.style.borderRadius = restartBtn.style.borderRadius = "8px";
nextBtn.style.border = restartBtn.style.border = "none";
nextBtn.style.fontSize = restartBtn.style.fontSize = "16px";
nextBtn.style.cursor = restartBtn.style.cursor = "pointer";
nextBtn.style.background = "#2563eb";
restartBtn.style.background = "#f87171";
nextBtn.style.color = restartBtn.style.color = "white";

contentBox.appendChild(nextBtn);
contentBox.appendChild(restartBtn);
nextBtn.style.display = "none";
restartBtn.style.display = "none";

// Función para leer en voz alta
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.voice = speechSynthesis.getVoices().find(v => v.name.includes('Google') && v.lang === 'es-ES') || null;
    speechSynthesis.speak(utterance);
}

// Función para mostrar bloque con color aleatorio
function showBlock(text) {
    block.innerHTML = text;
    block.style.background = colors[Math.floor(Math.random() * colors.length)];
    block.style.padding = "15px";
    block.style.borderRadius = "10px";
    speak(text);
}

// Función para mostrar siguiente bloque
function nextBlock() {
    if (current < sessionBlocks.length) {
        showBlock(sessionBlocks[current].texto);
        current++;
        if (current === sessionBlocks.length) {
            nextBtn.style.display = "none";
            restartBtn.style.display = "block";
        }
    }
}

// Función para reiniciar
function restartSession() {
    current = 0;
    restartBtn.style.display = "none";
    nextBtn.style.display = "block";
    nextBlock();
}

// Genera HTML para adivinanza con botón oculto
function generatePuzzle(question, answer) {
    return `${question} <button onclick="alert('${answer}')">Mostrar respuesta</button>`;
}

// Iniciar sesión
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    nextBtn.style.display = "block";

    const response = await fetch("/session_content");
    const data = await response.json();

    // Bloques con interactividad
    sessionBlocks = [
        { texto: data.bloques[0] }, // Apertura
        { texto: data.bloques[1] }, // Historia
        { texto: generatePuzzle("Si inviertes $5 al día, ¿cuánto tendrás en 10 años?", "$5 diarios → ~ $22,000") }, // Ejercicio interactivo
        { texto: data.bloques[3] }, // Respiración
        { texto: data.bloques[4] }, // Visualización
        { texto: data.bloques[5] }  // Cierre
    ];

    nextBlock();
});

nextBtn.addEventListener("click", nextBlock);
restartBtn.addEventListener("click", restartSession);
