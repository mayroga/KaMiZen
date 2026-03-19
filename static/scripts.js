const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const block = document.getElementById("block");
const logo = document.getElementById("logo");

let bloques = [];
let currentIdx = 0;
let skipFlag = false;
let isAdmin = false;

/* PERSISTENCIA: Control de Sesión del 1 al 70 */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    lastSessionId: 0, // 0 significa que la próxima es la 1
    disciplina: 50,
    claridad: 50,
    calma: 50
};

function updateUI() {
    document.getElementById("disciplina-bar").style.width = userData.disciplina + "%";
    document.getElementById("claridad-bar").style.width = userData.claridad + "%";
    document.getElementById("calma-bar").style.width = userData.calma + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

// MOTOR DE VOZ
function hablar(texto) {
    return new Promise(resolve => {
        if (!texto) return resolve();
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.9;
        msg.onend = () => resolve();
        msg.onerror = () => resolve();
        speechSynthesis.speak(msg);
        setTimeout(resolve, 8000); 
    });
}

// PANEL ADMIN: DOBLE CLICK EN LOGO
logo.ondblclick = async () => {
    const u = prompt("User:");
    const p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });

    if (res.ok) {
        isAdmin = true;
        const targetId = prompt("MODO ADMIN: ¿A qué ID de sesión quieres saltar? (1-70)");
        if (targetId) {
            userData.lastSessionId = parseInt(targetId) - 1;
            updateUI();
            alert(`Sesión ajustada. Pulsa INICIAR para entrar a la ID ${targetId}`);
            location.reload();
        }
    }
};

// INICIAR SESIÓN (Lógica de Progresión)
startBtn.onclick = async () => {
    startBtn.style.display = "none";
    block.innerHTML = "<h3>SINCRONIZANDO SESIÓN...</h3>";
    
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        
        // Determinar ID correlativa
        let proximoId = userData.lastSessionId + 1;
        let sesion = data.sesiones.find(s => s.id === proximoId);

        // Si se acaban las sesiones (ej. llegas a la 71), vuelve a la 1
        if (!sesion) {
            sesion = data.sesiones[0];
            userData.lastSessionId = 0;
        }

        if (sesion) {
            bloques = sesion.bloques;
            currentIdx = 0;
            userData.lastSessionId = sesion.id;
            updateUI();
            
            block.innerHTML = `<h3>SESIÓN ${sesion.id}</h3><p>Preparando entorno...</p>`;
            setTimeout(renderBloque, 2000);
        }
    } catch (e) {
        block.innerHTML = "<h3>ERROR DE CONEXIÓN</h3>";
        startBtn.style.display = "block";
    }
};

async function renderBloque() {
    const b = bloques[currentIdx];
    if (!b) return;

    skipFlag = false;
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    document.body.style.background = b.color || "#020617";

    // Lector Universal (JSON Friendly)
    const texto = b.texto || b.instrucciones || b.pregunta || "";
    if (b.titulo) block.innerHTML += `<h3>${b.titulo}</h3>`;
    block.innerHTML += `<p>${texto}</p>`;

    await hablar(texto);

    if (b.tipo === "respiracion") {
        block.innerHTML += `<div class="breath-circle" id="circle"></div><h2 id="label"></h2>`;
        const circle = document.getElementById("circle");
        const label = document.getElementById("label");
        for (let i = 0; i < (b.repeticiones || 2); i++) {
            if (skipFlag) break;
            label.innerText = "INHALA"; circle.style.transform = "scale(1.8)";
            await hablar("Inhala"); await new Promise(r => setTimeout(r, 3000));
            label.innerText = "RETÉN";
            await hablar("Retén"); await new Promise(r => setTimeout(r, 2000));
            label.innerText = "EXHALA"; circle.style.transform = "scale(1)";
            await hablar("Exhala"); await new Promise(r => setTimeout(r, 3000));
        }
    } 
    else if (b.tipo === "decision") {
        skipBtn.style.display = "none";
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = (i === b.correcta);
                userData.disciplina += esCorrecto ? 10 : -15;
                updateUI();
                block.innerHTML = `<h3>${esCorrecto ? 'LOGRADO' : 'ERROR'}</h3><p>${b.explicacion}</p>`;
                await hablar(b.explicacion);
                finalizarPaso();
            };
            block.appendChild(btn);
        });
        return;
    }

    finalizarPaso();
}

function finalizarPaso() {
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) renderBloque();
    else {
        block.innerHTML = "<h3>SESIÓN FINALIZADA</h3><p>Mente forjada.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 4000);
    }
};

skipBtn.onclick = () => {
    skipFlag = true;
    speechSynthesis.cancel();
    userData.disciplina = Math.max(0, userData.disciplina - 30);
    updateUI();
    block.innerHTML = "<h3 style='color:red;'>DISCIPLINA ROTA</h3>";
    setTimeout(finalizarPaso, 1500);
};

updateUI();
