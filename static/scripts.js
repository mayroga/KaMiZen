const STRIPE_URL = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const blockText = document.getElementById("text-content");
const glob = document.getElementById("breath-glob");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const optContainer = document.getElementById("options-container");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;
let stats = { disciplina: 60, claridad: 50, calma: 50 };

function hablar(texto) {
    return new Promise((resolve) => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.9;
        msg.onend = () => resolve();
        msg.onerror = () => resolve();
        speechSynthesis.speak(msg);
        setTimeout(resolve, 8000); // Fail-safe
    });
}

function updateUI() {
    document.getElementById("d-bar").style.width = stats.disciplina + "%";
    document.getElementById("cl-bar").style.width = stats.claridad + "%";
    document.getElementById("ca-bar").style.width = stats.calma + "%";
}

// LOGIN ADMIN
document.getElementById("logo").addEventListener('dblclick', async () => {
    const u = prompt("User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { 
        isAdmin = true; 
        banner.style.background = "#059669"; 
        blockText.innerHTML = "<h3>MODO ADMIN</h3><p>Sesión desbloqueada.</p>";
    }
});

async function checkStatus() {
    if (isAdmin) return;
    const res = await fetch("/api/status");
    const st = await res.json();
    if (st.is_open && st.mins_left <= 10) banner.style.background = "#ef4444";
    if (!st.is_open) {
        startBtn.style.display = "none";
        blockText.innerHTML = `<h3>SISTEMA CERRADO</h3><p>Próximo acceso: ${st.next}</p>`;
    }
}

startBtn.onclick = async () => {
    const pago = new URLSearchParams(window.location.search).get("pago") === "exito";
    if (!pago && !isAdmin) { window.location.href = STRIPE_URL; return; }

    const res = await fetch("/session_content", { headers: {"X-Admin-Access": isAdmin ? "true" : "false"} });
    const data = await res.json();
    bloques = data.sesiones[0].bloques;
    startBtn.style.display = "none";
    renderBloque();
};

async function renderBloque() {
    const b = bloques[currentIdx];
    if (!b) return;

    // AMBIENTE
    document.body.style.background = b.color || "#020617";
    blockText.innerHTML = b.titulo ? `<h3>${b.titulo}</h3>` : "";
    blockText.innerHTML += `<p>${b.texto || b.instrucciones}</p>`;
    nextBtn.style.display = "none";
    glob.style.display = "none";
    optContainer.innerHTML = "";

    // VOZ
    await hablar(b.texto || b.instrucciones);

    if (b.tipo === "respiracion") {
        glob.style.display = "block";
        for (let i = 0; i < (b.repeticiones || 1); i++) {
            glob.style.transform = "scale(1.7)";
            await hablar("Inhala...");
            glob.style.transform = "scale(1)";
            await hablar("Exhala...");
        }
        nextBtn.style.display = "block";
    } 
    else if (b.tipo === "decision") {
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                optContainer.innerHTML = "";
                const esCorrecto = (i === b.correcta);
                stats.disciplina += esCorrecto ? 10 : -20;
                updateUI();
                
                blockText.innerHTML = `<h3>${esCorrecto ? 'EXCELENTE' : 'ERROR'}</h3><p>${b.explicacion}</p>`;
                await hablar(b.explicacion);
                nextBtn.style.display = "block";
            };
            optContainer.appendChild(btn);
        });
    } 
    else {
        setTimeout(() => { nextBtn.style.display = "block"; }, 3000);
    }
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) renderBloque();
    else {
        blockText.innerHTML = "<h3>FORJA COMPLETADA</h3><p>Tu racha ha aumentado.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 5000);
    }
};

checkStatus();
updateUI();
