const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const blockText = document.getElementById("text-content");
const glob = document.getElementById("breath-glob");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;
let stats = { disciplina: 60, claridad: 50, calma: 50 };

// VOZ CON FALLBACK (Para que no se congele si falla el audio)
function hablar(texto) {
    return new Promise((resolve) => {
        if (!texto) return resolve();
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.9;
        msg.onend = () => resolve();
        msg.onerror = () => resolve(); // Si hay error, continúa la app
        speechSynthesis.speak(msg);
        
        // Timeout de seguridad: si la voz se traba, libera la app en 10s
        setTimeout(resolve, 10000);
    });
}

function updateStats() {
    document.getElementById("disciplina-bar").style.width = stats.disciplina + "%";
    document.getElementById("claridad-bar").style.width = stats.claridad + "%";
    document.getElementById("calma-bar").style.width = stats.calma + "%";
}

// LOGIN ADMIN ACTUALIZADO
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("User:"), p = prompt("Pass:");
    if(!u || !p) return;
    
    try {
        const res = await fetch("/admin_auth", {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({user:u, pass_word:p})
        });
        if(res.ok) { 
            isAdmin = true; 
            banner.style.background = "#059669"; 
            blockText.innerHTML = "<h3>ADMIN AUTORIZADO</h3><p>Acceso total liberado.</p>";
            startBtn.style.display = "block";
            startBtn.innerText = "INICIAR PRUEBA";
        } else { alert("Acceso denegado."); }
    } catch(e) { alert("Error de servidor."); }
};

async function checkSystem() {
    if (isAdmin) return;
    try {
        const res = await fetch("/api/status");
        const st = await res.json();
        if (st.is_open && st.mins_left <= 10) banner.style.background = "#ef4444";
        if (!st.is_open) {
            startBtn.style.display = "none";
            blockText.innerHTML = `<h3>SISTEMA CERRADO</h3><p>Próximo pulso: ${st.next}</p><p style='font-size:12px; margin-top:10px; color:#60a5fa;'>Reserva por $5.99</p>`;
        } else {
            blockText.innerHTML = "<h3>SISTEMA LISTO</h3><p>La forja te espera.</p>";
        }
    } catch(e) { blockText.innerText = "Conectando..."; }
}

startBtn.onclick = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pago") !== "exito" && !isAdmin) {
        window.location.href = STRIPE_URL;
        return;
    }

    blockText.innerText = "Sincronizando Mente...";
    try {
        const res = await fetch("/session_content", { headers: {"X-Admin-Access": isAdmin ? "true" : "false"} });
        const data = await res.json();
        bloques = data.sesiones[0].bloques;
        currentIdx = 0;
        startBtn.style.display = "none";
        renderBloque();
    } catch(e) { blockText.innerText = "Error al cargar bloques."; }
};

async function renderBloque() {
    const b = bloques[currentIdx];
    if (!b) return;

    // Reset Escena
    document.body.style.background = b.color || "#020617";
    blockText.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    glob.style.display = "none";
    glob.style.transform = "scale(1)";

    // Contenido
    if (b.titulo) blockText.innerHTML = `<h3>${b.titulo}</h3>`;
    if (b.texto) blockText.innerHTML += `<p>${b.texto}</p>`;

    // Lógica Respiración Sincronizada
    if (b.tipo === "respiracion") {
        glob.style.display = "block";
        for (let i = 0; i < (b.repeticiones || 1); i++) {
            glob.style.transform = "scale(1.8)";
            await hablar("Inhala profundamente...");
            await hablar("Mantén el aire.");
            glob.style.transform = "scale(1)";
            await hablar("Exhala lentamente.");
        }
    } else {
        await hablar(b.texto || b.instrucciones);
    }

    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

skipBtn.onclick = async () => {
    speechSynthesis.cancel();
    stats.disciplina = Math.max(0, stats.disciplina - 80);
    updateStats();
    blockText.innerHTML = "<h3 style='color:#ef4444;'>DISCIPLINA ROTA</h3><p>La evasión es para los débiles.</p>";
    await hablar("Has fallado a la disciplina.");
    setTimeout(() => {
        currentIdx++;
        if (currentIdx < bloques.length) renderBloque();
    }, 2000);
};

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) renderBloque();
    else {
        blockText.innerHTML = "<h3>SESIÓN FINALIZADA</h3><p>Mente forjada.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 5000);
    }
};

updateStats();
checkSystem();
