const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const block = document.getElementById("block");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;

// 1. Verificar Estado al Iniciar
async function init() {
    try {
        const res = await fetch("/api/status");
        const st = await res.json();
        
        // Cambio de color por urgencia (Rojo si quedan < 10 min)
        if (st.is_open && st.mins_left <= 10) banner.style.background = "#ef4444";

        if (!st.is_open && !isAdmin) {
            renderExplicacion(st.next);
        } else {
            block.innerHTML = "<h3>SISTEMA ABIERTO</h3><p>Listo para forjar tu mente.</p>";
        }
    } catch (e) { block.innerHTML = "Error de red. Reintenta."; }
}

function renderExplicacion(proxima) {
    block.innerHTML = `
        <div style="text-align:left; font-size:14px;">
            <p><b>¿Qué es?</b> Asesoría neuro-mental de élite.</p>
            <p><b>Resuelve:</b> Falta de enfoque y debilidad disciplinaria.</p>
            <p><b>Reglas:</b> $5.99 por sesión. Solo 30 min. Cupo: 500.</p>
            <p style="margin-top:10px; color:#60a5fa;">Abre: ${proxima}</p>
        </div>`;
}

// 2. Login Admin (Doble clic en Logo)
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { isAdmin = true; alert("Admin Activo"); init(); }
};

// 3. Iniciar Sesión (Validar Pago)
startBtn.onclick = async () => {
    const pagoExitoso = new URLSearchParams(window.location.search).get("pago") === "exito";
    
    if (!pagoExitoso && !isAdmin) {
        window.location.href = STRIPE_URL;
        return;
    }

    block.innerHTML = "Sincronizando...";
    const res = await fetch("/session_content", {
        headers: {"X-Admin-Access": isAdmin ? "true" : "false"}
    });
    const data = await res.json();
    
    if (!isAdmin) window.history.replaceState({}, "", "/"); // Limpiar URL
    
    bloques = data.sesiones[0].bloques;
    currentIdx = 0;
    startBtn.style.display = "none";
    mostrarBloque();
};

function mostrarBloque() {
    const b = bloques[currentIdx];
    block.innerHTML = `<h3>${b.titulo || "Fase"}</h3><p>${b.texto || b.instrucciones}</p>`;
    nextBtn.style.display = "none";
    
    // Si es decisión, crear botones
    if (b.tipo === "decision") {
        b.opciones.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "opt";
            btn.innerText = opt;
            btn.onclick = () => { nextBtn.style.display = "block"; };
            block.appendChild(btn);
        });
    } else {
        setTimeout(() => { nextBtn.style.display = "block"; }, 3000);
    }
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) mostrarBloque();
    else {
        block.innerHTML = "<h3>SESIÓN FINALIZADA</h3>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 3000);
    }
};

init();
