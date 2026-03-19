const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const blockText = document.getElementById("text-content");
const glob = document.getElementById("breath-glob");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;

// MOTOR DE VOZ CON PROMESA PARA SINCRONIZACIÓN
function hablar(texto) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.9;
        msg.onend = () => resolve(); // Avisa cuando termina de hablar
        speechSynthesis.speak(msg);
    });
}

async function checkSystem() {
    if (isAdmin) return;
    try {
        const res = await fetch("/api/status");
        const st = await res.json();
        if (st.is_open && st.mins_left <= 10) banner.style.background = "#ef4444";
        if (!st.is_open) {
            startBtn.style.display = "none";
            blockText.innerHTML = `<h3>SISTEMA CERRADO</h3><p>Próxima forja: ${st.next}</p>`;
        }
    } catch (e) { console.log("Error de status"); }
}

// LOGIN ADMIN
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { 
        isAdmin = true; 
        banner.style.background = "#059669"; 
        blockText.innerHTML = "<h3>MODO ADMIN</h3><p>Acceso Concedido.</p>";
        startBtn.style.display = "block";
    }
};

startBtn.onclick = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pago") !== "exito" && !isAdmin) {
        window.location.href = STRIPE_URL;
        return;
    }
    const res = await fetch("/session_content", { headers: {"X-Admin-Access": isAdmin ? "true" : "false"} });
    const data = await res.json();
    if (!isAdmin) window.history.replaceState({}, "", "/");
    bloques = data.sesiones[0].bloques;
    currentIdx = 0;
    startBtn.style.display = "none";
    renderBloque();
};

async function renderBloque() {
    // 1. LIMPIEZA TOTAL
    nextBtn.style.display = "none";
    glob.style.display = "none";
    glob.style.transform = "scale(1)";
    blockText.innerHTML = "";

    const b = bloques[currentIdx];

    // 2. MOSTRAR TEXTO Y HABLAR
    blockText.innerHTML = `<h3>${b.titulo || "Instrucción"}</h3><p>${b.texto || b.instrucciones}</p>`;
    
    // Esperar a que termine de hablar antes de actuar
    await hablar(b.texto || b.instrucciones);

    // 3. LÓGICA DE RESPIRACIÓN (Solo después de hablar)
    if (b.tipo === "respiracion") {
        glob.style.display = "block";
        // Ciclo de respiración: 4s inhalar, 4s exhalar
        setTimeout(() => { glob.style.transform = "scale(1.8)"; }, 100);
        setTimeout(() => { 
            glob.style.transform = "scale(1)"; 
            // El botón aparece SOLO después de completar la respiración
            setTimeout(() => { nextBtn.style.display = "block"; }, 4000);
        }, 4000);
    } 
    // 4. LÓGICA DE DECISIÓN
    else if (b.tipo === "decision") {
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.style.marginTop = "10px";
            btn.style.background = "#374151";
            btn.innerText = opt;
            btn.onclick = async () => {
                blockText.innerHTML = `<p>${b.explicacion}</p>`;
                await hablar(b.explicacion);
                nextBtn.style.display = "block";
            };
            blockText.appendChild(btn);
        });
    } 
    // 5. BLOQUE DE TEXTO SIMPLE
    else {
        nextBtn.style.display = "block";
    }
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) {
        renderBloque();
    } else {
        blockText.innerHTML = "<h3>SESIÓN FINALIZADA</h3><p>Mente Forjada.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 5000);
    }
};

checkSystem();
