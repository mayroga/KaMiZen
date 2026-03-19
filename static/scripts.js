const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const blockText = document.getElementById("text-content");
const glob = document.getElementById("breath-glob");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;

// MOTOR DE VOZ
function hablar(texto) {
    if (!texto) return;
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = 'es-US';
    msg.rate = 0.9;
    speechSynthesis.speak(msg);
}

// ESTADO DEL SISTEMA
async function checkSystem() {
    if (isAdmin) return;
    try {
        const res = await fetch("/api/status");
        const st = await res.json();
        
        if (st.is_open && st.mins_left <= 10) banner.style.background = "#ef4444";

        if (!st.is_open) {
            startBtn.style.display = "none";
            blockText.innerHTML = `
                <div style="text-align:left; font-size:14px;">
                    <h3 style="color:#ef4444; margin-bottom:10px;">SISTEMA BLOQUEADO</h3>
                    <p><b>Qué hace:</b> Hackea tu disciplina en 30 min.</p>
                    <p><b>Resuelve:</b> Debilidad mental y falta de enfoque.</p>
                    <p style="margin-top:10px; color:#60a5fa;"><b>Próximo Pulso:</b> ${st.next} (Miami)</p>
                    <button onclick="window.location.href='${STRIPE_URL}'" style="background:#10b981; margin-top:20px;">PAGAR SESIÓN ($5.99)</button>
                </div>`;
        } else {
            blockText.innerHTML = "<h3>SISTEMA ABIERTO</h3><p>Presiona para iniciar tu forja mental.</p>";
        }
    } catch (e) { blockText.innerText = "Error de conexión."; }
}

// ADMIN BYPASS
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("Admin User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { 
        isAdmin = true; 
        banner.style.background = "#059669"; 
        alert("MODO ADMIN: ACCESO LIBRE"); 
        checkSystem(); 
        startBtn.style.display = "block";
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
    const res = await fetch("/session_content", {
        headers: {"X-Admin-Access": isAdmin ? "true" : "false"}
    });
    const data = await res.json();
    
    if (!isAdmin) window.history.replaceState({}, "", "/");
    
    bloques = data.sesiones[0].bloques;
    currentIdx = 0;
    startBtn.style.display = "none";
    renderBloque();
};

function renderBloque() {
    const b = bloques[currentIdx];
    nextBtn.style.display = "none";
    glob.style.display = "none";
    
    blockText.innerHTML = `<h3>${b.titulo || ""}</h3><p>${b.texto || b.instrucciones}</p>`;
    hablar(b.texto || b.instrucciones);

    if (b.tipo === "respiracion") {
        glob.style.display = "block";
        blockText.innerHTML = `<p>${b.instrucciones}</p>`;
        // Animación del globo azul
        setTimeout(() => { glob.style.transform = "scale(1.8)"; }, 100);
        setTimeout(() => { 
            glob.style.transform = "scale(1)"; 
            setTimeout(() => { nextBtn.style.display = "block"; }, 4000);
        }, 4000);

    } else if (b.tipo === "decision") {
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "opt-btn";
            btn.innerText = opt;
            btn.onclick = () => {
                blockText.innerHTML = `<p>${b.explicacion}</p>`;
                hablar(b.explicacion);
                nextBtn.style.display = "block";
            };
            block.appendChild(btn);
        });
    } else {
        setTimeout(() => { nextBtn.style.display = "block"; }, 5000);
    }
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) renderBloque();
    else {
        blockText.innerHTML = "<h3>SESIÓN COMPLETADA</h3><p>Vuelve en la próxima ventana.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 5000);
    }
};

checkSystem();
