const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const blockContainer = document.getElementById("block");
const blockText = document.getElementById("text-content");
const glob = document.getElementById("breath-glob");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;

// MOTOR DE VOZ CON PROMESA (Para esperar a que termine de hablar)
function hablar(texto) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.9;
        msg.onend = () => resolve();
        speechSynthesis.speak(msg);
    });
}

// CONTROL DE ESTADO
async function checkSystem() {
    if (isAdmin) return;
    try {
        const res = await fetch("/api/status");
        const st = await res.json();
        
        if (st.is_open && st.mins_left <= 10) {
            banner.style.background = "#ef4444";
        }

        if (!st.is_open) {
            startBtn.style.display = "none";
            blockText.innerHTML = `<h3>SISTEMA CERRADO</h3><p>Próximo acceso: ${st.next}</p>`;
        }
    } catch (e) { console.error("Error de estado"); }
}

// LOGIN ADMIN
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("Admin User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { 
        isAdmin = true; 
        banner.style.background = "#059669"; 
        alert("MODO ADMIN ACTIVO"); 
        startBtn.style.display = "block";
        blockText.innerText = "SESIÓN LIBRE ACTIVADA";
    }
};

// INICIO DE SESIÓN
startBtn.onclick = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pago") !== "exito" && !isAdmin) {
        window.location.href = STRIPE_URL;
        return;
    }

    blockText.innerText = "Sincronizando Mente...";
    try {
        const res = await fetch("/session_content", { 
            headers: {"X-Admin-Access": isAdmin ? "true" : "false"} 
        });
        const data = await res.json();
        
        if (!isAdmin) window.history.replaceState({}, "", "/");
        
        bloques = data.sesiones[0].bloques;
        currentIdx = 0;
        startBtn.style.display = "none";
        renderBloque();
    } catch (e) { alert("Error al cargar contenido"); }
};

// MOTOR DE RENDERIZADO SINCRONIZADO
async function renderBloque() {
    const b = bloques[currentIdx];
    
    // 1. Limpieza total de pantalla anterior
    nextBtn.style.display = "none";
    glob.style.display = "none";
    glob.style.transform = "scale(1)"; 
    blockText.innerHTML = "";

    // 2. Mostrar Título y Texto
    if (b.titulo) blockText.innerHTML = `<h3>${b.titulo}</h3>`;
    if (b.texto || b.instrucciones) {
        blockText.innerHTML += `<p>${b.texto || b.instrucciones}</p>`;
    }

    // 3. Ejecutar Voz y esperar que termine
    await hablar(b.texto || b.instrucciones);

    // 4. Lógica específica por tipo de bloque
    if (b.tipo === "respiracion") {
        glob.style.display = "block";
        // Ciclo de respiración: 4s inhalar, 4s exhalar
        await animarRespiracion(4000); 
        nextBtn.style.display = "block";
    } 
    else if (b.tipo === "decision") {
        // En decisiones no hay auto-continuar, espera al click
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "opt-btn"; // Asegúrate de tener este estilo en el HTML
            btn.style = "width:100%; padding:12px; margin-top:8px; background:#374151; border:none; color:white; border-radius:10px; cursor:pointer;";
            btn.innerText = opt;
            btn.onclick = async () => {
                const explicacion = b.explicacion || "Decisión registrada.";
                blockText.innerHTML = `<p>${explicacion}</p>`;
                await hablar(explicacion);
                nextBtn.style.display = "block";
            };
            blockText.appendChild(btn);
        });
    } 
    else {
        // Bloque de texto normal: espera 2 segundos extra tras hablar
        setTimeout(() => { nextBtn.style.display = "block"; }, 2000);
    }
}

// Función para controlar el globo azul a la par del tiempo
function animarRespiracion(ms) {
    return new Promise((resolve) => {
        // Inhalar
        glob.style.transform = "scale(1.8)";
        setTimeout(() => {
            // Exhalar
            glob.style.transform = "scale(1)";
            setTimeout(() => {
                resolve();
            }, ms);
        }, ms);
    });
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) {
        renderBloque();
    } else {
        blockText.innerHTML = "<h3>SESIÓN COMPLETADA</h3><p>Tu mente ha sido forjada.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 5000);
    }
};

checkSystem();
