// ----------------------------------------------------
// KaMiZen 20 bloques secuenciales - scripts.js
// ----------------------------------------------------

const startBtn = document.getElementById("start-btn");
const nextBtn = document.createElement("button");
const restartBtn = document.createElement("button");
const block = document.getElementById("block");
const contentBox = document.getElementById("content-box");

let sessionBlocks = [];
let current = 0;

// Crear botones Siguiente y Reiniciar
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

// Colores llamativos por bloque
const colors = [
  "#1e3a8a","#2563eb","#7c3aed","#db2777","#f43f5e",
  "#f59e0b","#10b981","#14b8a6","#22d3ee","#0ea5e9",
  "#facc15","#84cc16","#4ade80","#34d399","#60a5fa",
  "#3b82f6","#8b5cf6","#ec4899","#f97316","#14b8a6"
];

// Juegos mentales/adivinanzas opcionales
const games = [
  {question: "Si tienes 7 cajas con 15 artículos cada una, ¿cuántos artículos hay?", answer: "105"},
  {question: "Si un inversor duplica $100 cada mes durante 3 meses, ¿cuánto tendrá?", answer: "800"},
  {question: "Adivina el número: soy par y mayor que 8 pero menor que 14", answer: "10"},
  {question: "Si caminas 2 km cada día durante 5 días, ¿cuántos km recorriste?", answer: "10"},
  {question: "Si compras 3 manzanas a $2 cada una y das $10, ¿cuánto te dan de cambio?", answer: "4"}
];

// Función de voz masculina
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 0.9; // voz más grave
    speechSynthesis.speak(utterance);
}

// Función para mostrar un bloque completo
function showBlock(blockObj, index) {
    contentBox.style.backgroundColor = colors[index % colors.length];

    let html = `
        <div class="section-title">Apertura:</div>${blockObj.apertura}<br><br>
        <div class="section-title">Historia:</div>${blockObj.historia}<br><br>
        <div class="section-title">Ejercicio:</div>${blockObj.ejercicio}<br><br>
        <div class="section-title">Respiración:</div>${blockObj.respiracion}<br><br>
        <div class="section-title">Visualización:</div>${blockObj.visualizacion}<br><br>
        <div class="section-title">Cierre:</div>${blockObj.cierre}<br><br>
    `;

    // Cada tercer bloque incluye un juego mental
    if ((index+1) % 3 === 0) {
        const game = games[index % games.length];
        html += `<div class="section-title">Juego Mental:</div>
                 ${game.question} 
                 <button onclick="this.nextElementSibling.style.display='inline'; this.style.display='none';" 
                         style="margin-left:5px;padding:2px 6px;">Mostrar Respuesta</button>
                 <span style="display:none;color:#fbbf24;font-weight:bold;"> ${game.answer}</span><br><br>`;
    }

    block.innerHTML = html;
    speak(`${blockObj.apertura} ${blockObj.historia} ${blockObj.ejercicio} ${blockObj.respiracion} ${blockObj.visualizacion} ${blockObj.cierre}`);
}

// Función para pasar al siguiente bloque
function nextBlock() {
    if (current < sessionBlocks.length) {
        showBlock(sessionBlocks[current], current);
        current++;
        nextBtn.style.display = (current < sessionBlocks.length) ? "inline" : "none";
        restartBtn.style.display = (current >= sessionBlocks.length) ? "inline" : "none";
        window.scrollTo(0,0);
    }
}

// Función para reiniciar la sesión
function restartSession() {
    current = 0;
    nextBtn.style.display = "inline";
    restartBtn.style.display = "none";
    block.innerHTML = "Bienvenido a tu sesión de 10 minutos";
    contentBox.style.backgroundColor = "#1e293b";
}

// Evento botón Siguiente
nextBtn.addEventListener("click", nextBlock);

// Evento botón Reiniciar
restartBtn.addEventListener("click", restartSession);

// Iniciar sesión
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";

    const response = await fetch("/session_content");
    const data = await response.json();

    // Usamos los 20 bloques de "sesiones" de tu JSON
    sessionBlocks = data.sesiones;

    nextBlock();
});
