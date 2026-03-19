const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const blockText = document.getElementById("text-content");
const glob = document.getElementById("breath-glob");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn"); // Asegúrate que este ID exista en tu HTML
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;
let stats = { disciplina: 50, claridad: 50, calma: 50 };

// MOTOR DE VOZ CON EVENTOS DE FASE
function hablar(texto) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.85; // Voz con peso y autoridad
        msg.onend = () => resolve();
        speechSynthesis.speak(msg);
    });
}

// ACTUALIZAR BARRAS DE ESTADO
function updateStats() {
    document.getElementById("disciplina-bar").style.width = stats.disciplina + "%";
    document.getElementById("claridad-bar").style.width = stats.claridad + "%";
    document.getElementById("calma-bar").style.width = stats.calma + "%";
}

// ADMINISTRADOR DISCRETO
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { 
        isAdmin = true; 
        banner.style.background = "#059669"; 
        alert("MODO ADMIN: ACCESO ILIMITADO ACTIVADO"); 
        checkSystem(); 
    }
};

async function checkSystem() {
    if (isAdmin) { startBtn.style.display = "block"; return; }
    const res = await fetch("/api/status");
    const st = await res.json();
    if (st.is_open && st.mins_left <= 10) banner.style.background = "#ef4444";
    if (!st.is_open) {
        startBtn.style.display = "none";
        blockText.innerHTML = `<h3>SISTEMA EN ESPERA</h3><p>Próximo Pulso: ${st.next}</p>`;
    }
}

// INICIAR SESIÓN
startBtn.onclick = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pago") !== "exito" && !isAdmin) {
        window.location.href = STRIPE_URL;
        return;
    }
    const res = await fetch("/session_content", { headers: {"X-Admin-Access": isAdmin ? "true" : "false"} });
    const data = await res.json();
    bloques = data.sesiones[0].bloques;
    currentIdx = 0;
    startBtn.style.display = "none";
    renderBloque();
};

// MOTOR DE BLOQUES CON CAMBIO DE COLOR Y SINCRONÍA
async function renderBloque() {
    const b = bloques[currentIdx];
    if (!b) return;

    // 1. Limpieza y Cambio de Atmósfera (Color de Fondo)
    document.body.style.background = b.color || "#020617"; 
    blockText.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    glob.style.display = "none";

    // 2. Renderizar Contenido
    if (b.titulo) blockText.innerHTML = `<h3>${b.titulo}</h3>`;
    if (b.texto) blockText.innerHTML += `<p>${b.texto}</p>`;

    // 3. Lógica de Respiración (Sincronía con el Globo)
    if (b.tipo === "respiracion") {
        glob.style.display = "block";
        for (let i = 0; i < (b.repeticiones || 1); i++) {
            // INHALA
            glob.style.transform = "scale(1.8)";
            glob.style.opacity = "1";
            await hablar("Inhala profundamente...");
            
            // RETÉN
            glob.style.boxShadow = "0 0 50px #60a5fa";
            await hablar("Mantén el aire, siente el poder...");
            
            // EXHALA
            glob.style.transform = "scale(1)";
            glob.style.opacity = "0.6";
            await hablar("Exhala todo el estrés.");
        }
    } else {
        await hablar(b.texto || b.instrucciones);
    }

    // 4. Finalizar Bloque
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

// BOTÓN SALTAR CON PENALIZACIÓN AGRESIVA
skipBtn.onclick = async () => {
    speechSynthesis.cancel();
    stats.disciplina = Math.max(0, stats.disciplina - 80); // Quita el 80% de disciplina
    updateStats();
    blockText.innerHTML = "<h3 style='color:#ef4444;'>DISCIPLINA ROTA</h3><p>Te estoy observando. La evasión tiene un costo.</p>";
    await hablar("La disciplina es el único camino al éxito. Has fallado.");
    setTimeout(renderBloque, 2000);
};

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) {
        renderBloque();
    } else {
        blockText.innerHTML = "<h3>SESIÓN FINALIZADA</h3><p>Has forjado tu mente hoy.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 5000);
    }
};

updateStats();
checkSystem();
