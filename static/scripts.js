const STRIPE_LINK = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const block = document.getElementById("block");
const logo = document.getElementById("logo");
const banner = document.getElementById("propaganda-banner");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;
let skipFlag = false;

/* ESTADÍSTICAS INICIALES */
let stats = { racha: 0, nivel: 1, disciplina: 50, claridad: 50, calma: 50 };

function updateUI() {
    document.getElementById("disciplina-bar").style.width = stats.disciplina + "%";
    document.getElementById("claridad-bar").style.width = stats.claridad + "%";
    document.getElementById("calma-bar").style.width = stats.calma + "%";
}

/* LOGIN ADMINISTRADOR */
logo.addEventListener("dblclick", async () => {
    const user = prompt("Admin User:");
    const pass = prompt("Password:");
    const res = await fetch("/admin_auth", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ user: user, pass_word: pass })
    });

    if (res.ok) {
        isAdmin = true;
        banner.style.background = "#059669"; // Verde éxito
        block.innerHTML = "<h3>MODO ADMIN ACTIVO</h3><p>Acceso Total Concedido.</p>";
        startBtn.style.display = "block";
        startBtn.innerText = "INICIAR SESIÓN (ADMIN)";
    } else {
        alert("Credenciales incorrectas.");
    }
});

/* CONTROL DE HORARIO Y BANNER */
async function checkSystem() {
    if (isAdmin) return;
    try {
        const res = await fetch("/api/status");
        const st = await res.json();

        // CAMBIO DE COLOR POR URGENCIA (MENOS DE 10 MIN)
        if (st.abierto && st.minutos_restantes <= 10) {
            banner.style.background = "#ef4444"; // Rojo Urgencia
        } else {
            banner.style.background = "#1e40af"; // Azul Normal
        }

        if (!st.abierto) {
            renderCerrado(st.proxima);
        } else {
            startBtn.style.display = "block";
            iniciarAutoCierre(st.minutos_restantes);
        }
    } catch (e) {
        block.innerHTML = "Error de conexión con el servidor.";
    }
}

function renderCerrado(proxima) {
    block.innerHTML = `
        <div style="text-align:center;">
            <h3 style="color:#60a5fa;">SISTEMA EN ESPERA</h3>
            <p style="font-size:14px; margin:10px 0;">KaMiZen abre 10:00 AM y 06:00 PM (Miami).</p>
            <p>Próximo Pulso: <b>${proxima}</b></p>
            <button onclick="window.location.href='${STRIPE_LINK}'" style="background:linear-gradient(90deg, #2563eb, #7c3aed); margin-top:15px; width:100%;">PAGAR SESIÓN ($5.99)</button>
        </div>`;
    startBtn.style.display = "none";
}

function iniciarAutoCierre(mins) {
    let segs = mins * 60;
    const timer = setInterval(() => {
        segs--;
        if (segs <= 0 && !isAdmin) {
            clearInterval(timer);
            window.location.href = "/"; // Cierre forzoso
        }
    }, 1000);
}

/* CARGA REAL DE CONTENIDO */
startBtn.addEventListener("click", async () => {
    const params = new URLSearchParams(window.location.search);
    const haPagado = params.get('pago') === 'exito';

    if (!haPagado && !isAdmin) {
        window.location.href = STRIPE_LINK;
        return;
    }

    block.innerHTML = "Cargando Red Neuronal...";
    
    try {
        const res = await fetch("/session_content", {
            headers: { "X-Admin-Access": isAdmin ? "true" : "false" }
        });
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        // Limpieza de URL para seguridad
        if (!isAdmin) window.history.replaceState({}, document.title, "/");

        // Extraer bloques de la primera sesión disponible
        bloques = data.sesiones[0].bloques;
        currentIdx = 0;
        startBtn.style.display = "none";
        ejecutarBloque(bloques[currentIdx]);

    } catch (e) {
        block.innerHTML = "Error al cargar la sesión.";
    }
});

/* MOTOR DE EJECUCIÓN DE BLOQUES */
async function ejecutarBloque(b) {
    if (!b) return;
    skipFlag = false;
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    document.body.style.background = b.color || "#020617";

    if (b.tipo === "respiracion") {
        block.innerHTML = `<p>${b.instrucciones}</p><div class="breath-circle" id="circle"></div>`;
        const circle = document.getElementById("circle");
        
        // Animación de respiración básica (Inhala 4s, Exhala 4s)
        circle.style.transform = "scale(1.8)";
        setTimeout(() => {
            if (!skipFlag) {
                circle.style.transform = "scale(1)";
                setTimeout(() => { if (!skipFlag) finalizarPaso(); }, 4000);
            }
        }, 4000);

    } else if (b.tipo === "decision") {
        skipBtn.style.display = "none";
        block.innerHTML = `<h3>${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = () => {
                block.innerHTML = `<p>${b.explicacion}</p>`;
                stats.disciplina += (i === b.correcta) ? 10 : -5;
                updateUI();
                finalizarPaso();
            };
            block.appendChild(btn);
        });
    } else {
        block.innerHTML = `<h3>${b.titulo || "Fase de Enfoque"}</h3><p>${b.texto || b.instrucciones}</p>`;
        setTimeout(() => { if (!skipFlag) finalizarPaso(); }, 5000);
    }
}

function finalizarPaso() {
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

skipBtn.addEventListener("click", () => {
    skipFlag = true;
    stats.disciplina = Math.floor(stats.disciplina * 0.2); // Penalización
    updateUI();
    block.innerHTML = "<h3 style='color:#ef4444;'>DISCIPLINA QUEBRANTADA</h3>";
    setTimeout(finalizarPaso, 1500);
});

nextBtn.addEventListener("click", () => {
    currentIdx++;
    if (currentIdx < bloques.length) {
        ejecutarBloque(bloques[currentIdx]);
    } else {
        block.innerHTML = "<h2>SESIÓN COMPLETADA</h2><p>Tu mente ha sido forjada. El sistema se cerrará en breve.</p>";
        nextBtn.style.display = "none";
        setTimeout(() => { window.location.href = "/"; }, 5000);
    }
});

/* INICIO DEL SISTEMA */
updateUI();
checkSystem();
