// ----------------------------------------------------
// KaMiZen - Sesión diaria secuencial
// ----------------------------------------------------

const startBtn = document.getElementById("start-btn");
const nextBtn = document.createElement("button");
const restartBtn = document.createElement("button");
const block = document.getElementById("block");
const contentBox = document.getElementById("content-box");

let sessionBlocks = [];
let current = parseInt(localStorage.getItem("currentBlock") || "0");

// Crear botón Siguiente
nextBtn.id = "next-btn";
nextBtn.innerText = "Siguiente";
nextBtn.style.display = "none";
nextBtn.style.marginTop = "10px";
nextBtn.style.padding = "10px 20px";
nextBtn.style.fontSize = "16px";
nextBtn.style.border = "none";
nextBtn.style.borderRadius = "6px";
nextBtn.style.background = "#10b981";
nextBtn.style.color = "white";
nextBtn.style.cursor = "pointer";
contentBox.appendChild(nextBtn);

// Crear botón Reiniciar
restartBtn.id = "restart-btn";
restartBtn.innerText = "Reiniciar";
restartBtn.style.display = "none";
restartBtn.style.marginTop = "10px";
restartBtn.style.padding = "10px 20px";
restartBtn.style.fontSize = "16px";
restartBtn.style.border = "none";
restartBtn.style.borderRadius = "6px";
restartBtn.style.background = "#ef4444";
restartBtn.style.color = "white";
restartBtn.style.cursor = "pointer";
contentBox.appendChild(restartBtn);

// Colores por bloque
const colors = [
  "#1e3a8a","#2563eb","#7c3aed","#db2777","#f43f5e",
  "#f59e0b","#10b981","#14b8a6","#22d3ee","#0ea5e9",
  "#facc15","#84cc16","#4ade80","#34d399","#60a5fa",
  "#3b82f6","#8b5cf6","#ec4899","#f97316","#14b8a6"
];

// Función de voz apasionada y relajante
function speak(text, callback) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;   // velocidad
    utterance.pitch = 1.0;  // tono natural
    utterance.volume = 1.0; // fuerte y clara
    utterance.onend = callback;
    speechSynthesis.speak(utterance);
}

// Función para mostrar paso por paso de un bloque
function showBlockDaily(blockObj, step = 0) {
    contentBox.style.backgroundColor = colors[current % colors.length];

    const steps = [
        {title: "Apertura", text: blockObj.apertura},
        {title: "Historia", text: blockObj.historia},
        {title: "Ejercicio", text: blockObj.ejercicio},
        {title: "Respiración", text: blockObj.respiracion},
        {title: "Visualización", text: blockObj.visualizacion},
        {title: "Cierre", text: blockObj.cierre}
    ];

    if (step < steps.length) {
        block.innerHTML = `<div class="section-title">${steps[step].title}:</div>${steps[step].text}`;
        speak(steps[step].text, () => showBlockDaily(blockObj, step + 1));
    } else {
        nextBtn.style.display = "inline";
        restartBtn.style.display = (current >= sessionBlocks.length-1) ? "inline" : "none";
        localStorage.setItem("currentBlock", current + 1); // guardar siguiente bloque para mañana
    }
}

// Avanzar al siguiente bloque (día siguiente)
function nextBlock() {
    if (current < sessionBlocks.length) {
        showBlockDaily(sessionBlocks[current]);
        current++;
    } else {
        block.innerHTML = "Has completado todos los bloques por ahora.";
        nextBtn.style.display = "none";
        restartBtn.style.display = "inline";
    }
}

// Reiniciar sesión completa
function restartSession() {
    current = 0;
    localStorage.setItem("currentBlock", "0");
    block.innerHTML = "Bienvenido a tu sesión de 10 minutos";
    contentBox.style.backgroundColor = "#1e293b";
    nextBtn.style.display = "inline";
    restartBtn.style.display = "none";
}

// Eventos
nextBtn.addEventListener("click", nextBlock);
restartBtn.addEventListener("click", restartSession);

startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";

    const response = await fetch("/session_content");
    const data = await response.json();

    sessionBlocks = data.sesiones;

    // Mostrar bloque diario según índice actual
    nextBlock();
});
