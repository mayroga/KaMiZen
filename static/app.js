let uid = null;
let lang = "es";
let voice;

// ================== VOZ ==================
function loadVoice() {
    const voices = speechSynthesis.getVoices();
    // Busca voz masculina en el idioma correcto
    voice = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes("male")) || voices[0];
}
speechSynthesis.onvoiceschanged = loadVoice;

function speak(text) {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.voice = voice;
    u.rate = 0.95;
    speechSynthesis.speak(u);
}

// ================== INTERFAZ ==================
function acceptLegal() {
    document.getElementById("legal").style.display = "none";
    document.getElementById("intro").style.display = "block";
}

function begin() {
    lang = document.getElementById("lang").value;
    const city = document.getElementById("city").value || "Unknown";
    const age = document.getElementById("age").value || 0;
    const profile = document.getElementById("profile").value;

    fetch("/start", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, age, profile, lang })
    })
    .then(r => r.json())
    .then(d => {
        uid = d.uid;
        document.getElementById("intro").style.display = "none";
        run();
    });
}

// ================== FLUJO DE 10 MINUTOS ==================
let stepInterval;
function run() {
    let stepIndex = 0;
    stepInterval = setInterval(() => {
        if (!uid) return;

        fetch(`/step/${uid}`)
        .then(r => r.json())
        .then(d => {
            if (d.end) {
                clearInterval(stepInterval);
                alert("¡Has completado tu sesión de La Vida Continúa!");
                return;
            }

            // VOZ
            speak(d.text);

            // TEXTO ORDENADO
            animateText(d.text, stepIndex);

            // MAPA Y OBSTÁCULOS
            moveMap(d.move, [], d.obstacle, [], d.mini_game);

            stepIndex++;
        });
    }, 60000); // cada minuto = 10 bloques en ~10 minutos
}

// ================== TEXTO ORDENADO ==================
function animateText(text, stepIndex) {
    const el = document.getElementById("floatingText");
    let content = "";

    switch(stepIndex % 10) {
        case 0:
        case 5:
            content = `<p><strong>Bienvenida:</strong> ${text}</p>`;
            break;
        case 1:
        case 6:
            content = `<p><strong>Historia:</strong> ${text}</p>`;
            break;
        case 2:
        case 7:
            content = `<p><strong>Inspiración:</strong> ${text}</p>`;
            break;
        case 3:
        case 8:
            content = `<p><strong>Microacción:</strong> ${text}</p>`;
            break;
        case 4:
        case 9:
            content = `<p><strong>Obstáculo / Mini-juego:</strong> ${text}</p>`;
            break;
    }

    el.innerHTML = content;
    el.className = "glow";
}

// ================== MINI-JUEGOS ==================
function showMiniGame(gameText) {
    const mg = document.getElementById("miniGame");
    // Divide el texto en pregunta y respuesta oculta usando ":::" como separador
    let [question, answer] = gameText.split(":::");
    mg.innerHTML = `<p>${question}</p>
        <button onclick="revealAnswer('${answer}')">Mostrar respuesta correcta</button>`;
}

function revealAnswer(ans) {
    const mg = document.getElementById("miniGame");
    mg.innerHTML += `<p>✅ Respuesta: ${ans}</p>`;
}

// ================== MAPA ==================
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let x = 50;
let y = canvas.height / 2;

function moveMap(step, mini_world, obstacle, choice, mini_game) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo negro con líneas
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camino de la vida
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, canvas.height / 2);
    ctx.quadraticCurveTo(x + step, y - 50, x + step, y);
    ctx.stroke();

    x += step;

    // Marcador del usuario
    ctx.fillStyle = "#00ccff";
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Obstáculos
    if (obstacle) {
        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.fillRect(x + 80, y - 30, 30, 60);
    }

    // Mini-juegos
    if (mini_game) showMiniGame(mini_game);
}
