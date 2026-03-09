const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let sessionBlocks = [];
let current = 0;

// Función de voz
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
async function showBlock(blockData, id) {
    const section = document.getElementById(id);
    section.innerHTML = blockData;
    section.style.opacity = 0;
    let opacity = 0;
    const fade = setInterval(() => {
        if(opacity < 1) { opacity += 0.05; section.style.opacity = opacity; }
        else clearInterval(fade);
    }, 50);
    await playVoice(blockData);
}

// Avanzar bloque
async function nextBlock() {
    if(current < sessionBlocks.length) {
        const step = sessionBlocks[current];
        current++;
        for (let key in step) {
            await showBlock(step[key], key);
        }
        if(current < sessionBlocks.length) {
            nextBtn.style.display = "inline-block";
        } else {
            restartBtn.style.display = "inline-block";
        }
    }
}

// Iniciar sesión
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const response = await fetch("/session_content");
    const data = await response.json();
    if(!data) { block.innerText = "Error al cargar sesión"; return; }
    
    sessionBlocks = [data]; // 1 sesión por día
    current = 0;
    nextBtn.style.display = "inline-block";
    nextBtn.addEventListener("click", async () => {
        nextBtn.style.display = "none";
        await nextBlock();
    });
});

// Reiniciar
restartBtn.addEventListener("click", () => {
    location.reload();
});
