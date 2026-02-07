// app.js – Controlador maestro KaMiZen
// Importa todos los módulos (suponiendo que están incluidos en index.html)

// Variables globales
let lang = "es";       // idioma por defecto
let level = "day";     // nivel
let uid = "";          // session ID del backend
let prevShown = false; // controla flujo para no saturar usuario

// Canvas
const canvas = document.getElementById("lifeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.8;

// Inicializar mapa y avatar
generateMap(canvas);
generateObstacles(canvas);

// Dibuja mapa y avatar continuamente
function drawAll() {
    drawMap(ctx, avatar);
    drawObstacles(ctx);
    drawAvatar(ctx);
    requestAnimationFrame(drawAll);
}
drawAll();

// ================== Funciones de idioma ==================
function setLang(l) {
    lang = l;
    speechSynthesis.cancel();
}

// ================== Voz y narración ==================
function narrateStory() {
    const story = getRandomStory();
    speakStory(story, lang);
}

function narratePhrase() {
    const phrase = getRandomPhrase();
    speak(phrase, lang);
}

// ================== Microacciones ==================
function doMicroaction(name) {
    const action = microactions.find(a => a.name === name);
    if(action){
        performMicroaction(action, visual);
        speak(`Has realizado: ${action.name}`, lang);
    }
}

// ================== Preguntas interactivas ==================
function askUserQuestion() {
    const q = askQuestion();
    speak(q, lang);
}

// ================== Timeline / flujo de sesión ==================
function startTimelineFlow() {
    const callbacks = [
        () => narratePhrase(),
        () => narrateStory(),
        () => askUserQuestion(),
        () => doMicroaction("respirar"),
        () => doMicroaction("estirarse"),
        () => narratePhrase(),
        () => narrateStory(),
        () => doMicroaction("cerrar_ojos"),
        () => askUserQuestion(),
        () => narratePhrase(),
        () => doMicroaction("respirar"),
        () => narrateStory(),
        () => doMicroaction("estirarse"),
        () => narratePhrase(),
        () => askUserQuestion(),
        () => narrateStory(),
        () => doMicroaction("cerrar_ojos"),
        () => narratePhrase(),
        () => narrateStory(),
        () => sessionEnd(avatar, path)
    ];

    startTimeline(callbacks);
}

// ================== Backend – Generar sesión con IA ==================
async function startLife() {
    const age = document.getElementById("age").value || "25";
    const mood = document.getElementById("mood").value || "neutral";
    const city = document.getElementById("city").value || "Miami";

    const res = await fetch("/life/guide", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({age,mood,lang,level,city})
    });

    const data = await res.json();
    uid = data.session_id;

    speak(data.message, lang); // Mensaje inicial de IA
    moveAvatar(ctx, path);     // Comienza movimiento del avatar
    startTimelineFlow();        // Inicia timeline de la sesión
}

// ================== Pagos Stripe ==================
async function pay(lvl){
    level = lvl;
    const price = lvl==="day"?9.99:99.99;

    const res = await fetch("/create-checkout-session",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            level:lvl,
            price:price,
            success:window.location.href,
            cancel:window.location.href
        })
    });

    const data = await res.json();
    window.location.href=data.url;
}

// ================== Eventos de botones ==================
document.getElementById("startBtn")?.addEventListener("click", startLife);
document.getElementById("langEnBtn")?.addEventListener("click", ()=>setLang("en"));
document.getElementById("langEsBtn")?.addEventListener("click", ()=>setLang("es"));
document.getElementById("payDayBtn")?.addEventListener("click", ()=>pay("day"));
document.getElementById("payNightBtn")?.addEventListener("click", ()=>pay("night"));

// ================== Ajuste de mood dinámico ==================
function updateMoodFlow() {
    const moods = ["calma","energia","relax","neutral"];
    setInterval(()=>{
        const mood = moods[Math.floor(Math.random()*moods.length)];
        visual.updateMood(mood);
    }, 45000); // cada 45 segundos
}
updateMoodFlow();

// ================== Eventos de microacciones manuales ==================
document.getElementById("btnRespirar")?.addEventListener("click", ()=>doMicroaction("respirar"));
document.getElementById("btnEstirarse")?.addEventListener("click", ()=>doMicroaction("estirarse"));
document.getElementById("btnCerrarOjos")?.addEventListener("click", ()=>doMicroaction("cerrar_ojos"));

// ================== Inicialización ==================
console.log("KaMiZen Nivel 1 cargado. Listo para iniciar sesión.");
