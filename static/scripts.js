// ----------------------------------------------------
// KaMiZen - Sesión diaria con voz local y control de tiempo
// ----------------------------------------------------

const startBtn = document.getElementById("start-btn");
const block = document.getElementById("block");
const contentBox = document.getElementById("content-box");

// Botones de control
const nextBtn = document.createElement("button");
nextBtn.innerText = "Siguiente";
nextBtn.id = "next-btn";
nextBtn.style.display = "none";
contentBox.appendChild(nextBtn);

const restartBtn = document.createElement("button");
restartBtn.innerText = "Reiniciar Sesión";
restartBtn.id = "restart-btn";
restartBtn.style.display = "none";
contentBox.appendChild(restartBtn);

// Colores atractivos
const colors = [
    "#1e3a8a","#2563eb","#7c3aed","#db2777","#f43f5e",
    "#f59e0b","#10b981","#14b8a6","#22d3ee","#0ea5e9",
    "#facc15","#84cc16","#4ade80","#34d399","#60a5fa",
    "#3b82f6","#8b5cf6","#ec4899","#f97316","#14b8a6"
];

let sessionBlocks = [];
let currentBlock = parseInt(localStorage.getItem("currentBlock") || "0");

// Función para reproducir voz local y esperar a que termine
function playVoice(text) {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = resolve; // resuelve cuando termina
        speechSynthesis.speak(utterance);
    });
}

// Función para mostrar paso por paso de un bloque
async function showBlock(blockObj) {
    contentBox.style.backgroundColor = colors[currentBlock % colors.length];

    const steps = [
        {title: "Apertura", text: blockObj.apertura},
        {title: "Historia", text: blockObj.historia},
        {title: "Ejercicio", text: blockObj.ejercicio},
        {title: "Respiración", text: blockObj.respiracion},
        {title: "Visualización", text: blockObj.visualizacion},
        {title: "Cierre", text: blockObj.cierre}
    ];

    for (let step of steps) {
        block.innerHTML = `<div class="section-title">${step.title}:</div>${step.text}`;

        // Espera a que el usuario interactúe si es necesario
        if (step.text.includes("¿")) {
            nextBtn.style.display = "inline";
            await new Promise((resolve) => {
                nextBtn.onclick = () => {
                    nextBtn.style.display = "none";
                    resolve();
                };
            });
        } else {
            // Si no hay interacción, espera a que termine la voz
            await playVoice(step.text);
        }
    }

    // Guardar bloque completado y mostrar botón reiniciar si es el último
    localStorage.setItem("currentBlock", currentBlock + 1);
    currentBlock++;
    if (currentBlock >= sessionBlocks.length) {
        restartBtn.style.display = "inline";
        block.innerHTML = "Has completado todos los bloques por ahora.";
    } else {
        nextBtn.style.display = "inline";
    }
}

// Función para iniciar sesión diaria
async function startSession() {
    startBtn.style.display = "none";

    // Cargar solo bloque del día
    const response = await fetch("/session_content");
    const data = await response.json();
    sessionBlocks = data.sesiones;

    if (currentBlock >= sessionBlocks.length) {
        block.innerHTML = "Ya completaste todos los bloques disponibles.";
        restartBtn.style.display = "inline";
        return;
    }

    showBlock(sessionBlocks[currentBlock]);
}

// Reiniciar sesión completa
function restartSession() {
    currentBlock = 0;
    localStorage.setItem("currentBlock", "0");
    block.innerHTML = "Bienvenido a tu sesión de 10 minutos";
    startBtn.style.display = "inline";
    nextBtn.style.display = "none";
    restartBtn.style.display = "none";
}

// Eventos
startBtn.addEventListener("click", startSession);
nextBtn.addEventListener("click", () => {
    nextBtn.style.display = "none";
    showBlock(sessionBlocks[currentBlock]);
});
restartBtn.addEventListener("click", restartSession);
