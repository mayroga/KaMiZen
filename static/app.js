const legalDiv = document.getElementById("legal");
const startButton = document.getElementById("startButton");
const estadoSelect = document.getElementById("estado_inicial");
const experienciaDiv = document.getElementById("experiencia");
const checkoutButton = document.getElementById("checkoutButton");

// --- Aceptar legal ---
document.getElementById("acceptLegal").addEventListener("click", async () => {
    const res = await fetch("/accept_legal", { method: "POST" });
    const data = await res.json();
    if (data.success) {
        legalDiv.style.display = "none";
        startButton.style.display = "block";
    }
});

// --- Iniciar experiencia ---
startButton.addEventListener("click", async () => {
    const estado = estadoSelect.value;
    const res = await fetch("/start_experience", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({estado_inicial: estado})
    });
    const data = await res.json();
    if (data.error) {
        alert(data.error);
        return;
    }
    
    // Limpiar anterior
    experienciaDiv.innerHTML = "";

    // Mostrar historias
    data.historias.forEach(h => {
        const p = document.createElement("p");
        p.textContent = h;
        experienciaDiv.appendChild(p);
    });

    // Mostrar frases
    data.frases.forEach(f => {
        const p = document.createElement("p");
        p.textContent = f;
        experienciaDiv.appendChild(p);
    });

    // Mostrar microacciones
    data.microacciones.forEach(m => {
        const p = document.createElement("p");
        p.textContent = m;
        experienciaDiv.appendChild(p);
    });

    // Mostrar juegos con botón de respuesta
    data.juegos.forEach(j => {
        const div = document.createElement("div");
        div.innerHTML = `<p>${j.pregunta}</p><button class="respuesta">${j.respuesta}</button>`;
        experienciaDiv.appendChild(div);
    });

    // Mostrar mapa
    const mapDiv = document.createElement("div");
    mapDiv.style.width = "90%";
    mapDiv.style.height = "400px";
    mapDiv.style.border = "2px solid #333";
    mapDiv.style.margin = "20px auto";
    mapDiv.style.display = "flex";
    mapDiv.style.justifyContent = "space-around";
    mapDiv.style.alignItems = "center";
    mapDiv.innerHTML = `<p style="text-align:center; font-weight:bold;">Mapa de la Vida - Destino: ${data.destino_final}</p>`;
    data.map_elements.forEach(e => {
        const span = document.createElement("span");
        span.textContent = e.nombre;
        span.style.fontSize = "18px";
        mapDiv.appendChild(span);
    });
    experienciaDiv.appendChild(mapDiv);

    // Mostrar obstáculos
    const obsDiv = document.createElement("div");
    obsDiv.innerHTML = "<h3>Obstáculos en tu camino:</h3>";
    data.obstaculos.forEach(o => {
        const p = document.createElement("p");
        p.textContent = o;
        obsDiv.appendChild(p);
    });
    experienciaDiv.appendChild(obsDiv);

    // Botón de pago
    checkoutButton.style.display = "block";
});

// --- Stripe Checkout ---
checkoutButton.addEventListener("click", async () => {
    const res = await fetch("/create_checkout_session", {method: "POST"});
    const session = await res.json();
    const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({ sessionId: session.id });
});
