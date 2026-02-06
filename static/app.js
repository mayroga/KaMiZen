// ================== CONFIGURACIÓN DE IDIOMAS ==================
const texts = { es:{}, en:{}, fr:{}, de:{}, zh:{} };

let currentLang = "en";
let userId = location.hostname; // simple tracking
let aiItems = [];
let aiIndex = 0;
let ttsEnabled = true;

// ================== CONFIGURACIÓN DE VOZ TTS ==================
function speak(text) {
    if (!ttsEnabled || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = currentLang;
    utter.pitch = 1.0;
    utter.rate = 1.0;
    utter.volume = 1.0;
    utter.voice = speechSynthesis.getVoices().find(v => v.lang.startsWith(currentLang)) || null;
    speechSynthesis.speak(utter);
}

// ================== CONSUMO AI-CONTENT ==================
async function fetchAIContent() {
    try {
        const res = await fetch(`/ai-content?user_id=${userId}`);
        const data = await res.json();
        aiItems = data.items;
        aiIndex = 0;
    } catch(e) {
        console.error("Error fetching AI content:", e);
    }
}

// ================== FUNCIONES DE INTERFAZ ==================
function setLang(lang){
    currentLang = lang;
    document.documentElement.lang = lang;
}

// ================== MICROACCIONES ==================
function recordMicroaction(action){
    fetch("/microaction",{
        method:"POST",
        body: new URLSearchParams({user_id, action})
    }).then(r=>r.json()).then(console.log)
}

// ================== AI DISPLAY ==================
function showNextAIItem() {
    if (!aiItems.length) return;
    const item = aiItems[aiIndex % aiItems.length];
    aiIndex++;

    // Texto flotante
    const canvasText = document.getElementById("canvas-text");
    canvasText.innerText = item;

    // Voz
    speak(item);

    // Cambios de color y animaciones
    const hue = Math.floor(Math.random() * 360);
    document.body.style.background = `hsl(${hue}, 60%, 10%)`;

    // Actualiza Canvas
    if (window.updateCanvas) window.updateCanvas(item);
}

// ================== CICLO INFINITO ==================
async function startAI() {
    await fetchAIContent();
    showNextAIItem();
    setInterval(async ()=>{
        aiIndex++;
        if(aiIndex >= aiItems.length) await fetchAIContent();
        showNextAIItem();
    }, 60000); // cada minuto
}

// ================== INICIALIZACIÓN ==================
window.addEventListener("load", ()=>{
    // Mostrar app después del loader
    setTimeout(()=>{
        document.getElementById("loader").style.display="none";
        document.getElementById("app").style.display="block";
    },1200);

    // Inicia AI
    startAI();
});
