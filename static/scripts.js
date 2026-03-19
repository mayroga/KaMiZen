const STRIPE_LINK = "https://buy.stripe.com/dRmaEW53V3XB3cH7Dt7Vm0l";
const startBtn = document.getElementById("start-btn");
const block = document.getElementById("block");
const logo = document.getElementById("logo");

let bloques = [];
let currentIdx = 0;
let isAdmin = false;

// COMANDO SECRETO: Doble clic en el Logo para Login Admin
logo.addEventListener("dblclick", async () => {
    const user = prompt("Usuario Administrador:");
    const pass = prompt("Contraseña:");
    
    const res = await fetch("/admin_auth", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ user: user, pass_word: pass })
    });

    if (res.ok) {
        isAdmin = true;
        alert("MODO ADMINISTRADOR ACTIVADO: Acceso libre total.");
        renderAdminReady();
    } else {
        alert("Credenciales incorrectas.");
    }
});

function renderAdminReady() {
    block.innerHTML = `<h3>MODO ADMIN ACTIVO</h3><p>Horario y Pago ignorados.</p>`;
    startBtn.style.display = "block";
    startBtn.innerText = "Iniciar Sesión (Modo Libre)";
}

async function checkSystem() {
    if (isAdmin) return; // Si ya es admin, no bloqueamos nada

    const res = await fetch("/api/status");
    const st = await res.json();

    if (!st.abierto) {
        renderCerrado(st.proxima);
    } else {
        iniciarTemporizadorCierre(st.minutos_restantes);
    }
}

function renderCerrado(proxima) {
    block.innerHTML = `
        <div style="border:1px solid #3b82f6; padding:20px; border-radius:15px;">
            <h3 style="color:#60a5fa;">SISTEMA EN ESPERA</h3>
            <p>Próximo acceso: ${proxima}</p>
            <button onclick="window.location.href='${STRIPE_LINK}'" style="background:#22c55e; margin-top:15px;">Pagar Sesión ($5.99)</button>
        </div>
    `;
    startBtn.style.display = "none";
}

function iniciarTemporizadorCierre(minutos) {
    let segs = minutos * 60;
    const countdown = setInterval(() => {
        segs--;
        if (segs <= 0 && !isAdmin) {
            clearInterval(countdown);
            location.href = "/"; // Auto-cierre
        }
    }, 1000);
}

startBtn.addEventListener("click", async () => {
    const params = new URLSearchParams(window.location.search);
    const haPagado = params.get('pago') === 'exito';

    if (!haPagado && !isAdmin) {
        window.location.href = STRIPE_LINK;
        return;
    }

    // Petición de contenido enviando bandera de admin si aplica
    const res = await fetch("/session_content", {
        headers: { "X-Admin-Access": isAdmin ? "true" : "false" }
    });
    
    const data = await res.json();
    if (data.error) {
        alert(data.error);
        return;
    }

    // Limpiar rastro de pago si no es admin
    if (!isAdmin) window.history.replaceState({}, document.title, "/");

    bloques = data.sesiones[0].bloques; // Ejemplo carga sesión 1
    ejecutarEntrenamiento();
});

function ejecutarEntrenamiento() {
    startBtn.style.display = "none";
    // Aquí sigue tu motor de bloques (voz, respiración, etc.)
    block.innerHTML = `<h3>Iniciando...</h3><p>Prepárate para la sesión.</p>`;
}

checkSystem();
