const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const block = document.getElementById("block");
const logo = document.getElementById("logo");

let bloques = [];
let currentIdx = 0;
let skipFlag = false;

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    lastSessionId: 0,
    disciplina: 50,
    claridad: 50,
    calma: 50
};

function updateUI() {
    // Líneas verdes y progreso
    const stats = [
        {id: "disciplina-bar", val: userData.disciplina, text: "val-disp"},
        {id: "claridad-bar", val: userData.claridad, text: "val-clar"},
        {id: "calma-bar", val: userData.calma, text: "val-calm"}
    ];
    
    stats.forEach(s => {
        const value = Math.min(100, Math.max(0, s.val));
        document.getElementById(s.id).style.width = value + "%";
        document.getElementById(s.text).innerText = value + "%";
    });
    
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

async function hablar(texto) {
    return new Promise(resolve => {
        if (!texto) return resolve();
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.95;
        msg.pitch = 1.0;
        msg.onend = () => resolve();
        speechSynthesis.speak(msg);
        // Backup por si falla el evento onend
        setTimeout(resolve, texto.length * 100); 
    });
}

logo.ondblclick = async () => {
    const u = prompt("Admin User:");
    const p = prompt("Password:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if (res.ok) {
        const targetId = prompt("SALTO DE SESIÓN (1-70):");
        if (targetId) {
            userData.lastSessionId = parseInt(targetId) - 1;
            updateUI();
            location.reload();
        }
    }
};

startBtn.onclick = async () => {
    startBtn.style.display = "none";
    block.innerHTML = "<h3>SINCRONIZANDO...</h3>";
    
    const res = await fetch("/session_content");
    const data = await res.json();
    
    let proximoId = userData.lastSessionId + 1;
    let sesion = data.sesiones.find(s => s.id === proximoId) || data.sesiones[0];

    if (sesion) {
        bloques = sesion.bloques;
        currentIdx = 0;
        userData.lastSessionId = sesion.id;
        updateUI();
        renderBloque();
    }
};

async function renderBloque() {
    const b = bloques[currentIdx];
    if (!b) return finalizarSesion();

    skipFlag = false;
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";

    if (b.titulo) block.innerHTML += `<h3>${b.titulo}</h3>`;
    const textoPrincipal = b.texto || b.pregunta || "";
    block.innerHTML += `<p>${textoPrincipal}</p>`;

    // El arma de voz inicia la instrucción
    await hablar(textoPrincipal);

    if (b.tipo === "decision") {
        skipBtn.style.display = "none";
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = () => procesarDecision(i, b);
            block.appendChild(btn);
        });
    } else {
        // Bloque informativo o respiración
        setTimeout(() => {
            nextBtn.style.display = "block";
            skipBtn.style.display = "none";
        }, 2000);
    }
}

async function procesarDecision(idxSeleccionado, bloque) {
    const esCorrecto = (idxSeleccionado === bloque.correcta);
    const feedbackClase = esCorrecto ? "feedback-correct" : "feedback-wrong";
    
    // Ajuste de niveles (Línea verde)
    if (esCorrecto) {
        userData.disciplina += 10;
        userData.claridad += 5;
    } else {
        userData.disciplina -= 15;
        userData.calma -= 10;
    }
    updateUI();

    // Explicación detallada
    const respuestaCorrectaTexto = bloque.opciones[bloque.correcta];
    const mensajeExplicativo = `${esCorrecto ? 'EXCELENTE. ' : 'ERROR DE JUICIO. '} La opción correcta es: ${respuestaCorrectaTexto}. Por qué: ${bloque.explicacion}`;
    
    block.innerHTML = `
        <h3 class="${feedbackClase}">${esCorrecto ? 'NIVEL LOGRADO' : 'NIVEL DISMINUIDO'}</h3>
        <p style="font-size:16px;">${mensajeExplicativo}</p>
    `;

    // El arma de voz explica la razón del éxito o fallo
    await hablar(mensajeExplicativo);
    
    nextBtn.style.display = "block";
}

function finalizarSesion() {
    block.innerHTML = "<h3>SESIÓN COMPLETADA</h3><p>Tu mente está más afilada hoy.</p>";
    hablar("Sesión completada. Tu mente está más afilada hoy. Sigue así.");
    setTimeout(() => location.reload(), 5000);
}

nextBtn.onclick = () => {
    currentIdx++;
    renderBloque();
};

skipBtn.onclick = async () => {
    skipFlag = true;
    speechSynthesis.cancel();
    userData.disciplina = Math.max(0, userData.disciplina - 30);
    updateUI();
    block.innerHTML = "<h3 style='color:#ef4444;'>DISCIPLINA ROTA</h3><p>Saltar el entrenamiento debilita el carácter.</p>";
    await hablar("Disciplina rota. Saltar el entrenamiento debilita el carácter.");
    setTimeout(() => { currentIdx++; renderBloque(); }, 2000);
};

updateUI();
