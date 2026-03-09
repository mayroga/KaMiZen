// Modifica estas funciones en tu scripts.js

async function showBlock(blockData) {
    // Limpiamos la interfaz al empezar
    nextBtn.style.display = "none";
    restartBtn.style.display = "none";
    gameBtn.style.display = "none";
    gameAnswer.style.display = "none";
    gameAnswer.innerHTML = "";

    const steps = ["apertura", "historia", "ejercicio", "respiracion", "visualizacion", "juego", "cierre"];

    for (let step of steps) {
        if (!blockData[step]) continue; // Saltar si el paso no existe

        changeBackground();
        
        if (step === "juego") {
            block.innerHTML = `<div class="section-title">Juego Mental:</div>${blockData[step].pregunta}`;
            gameBtn.style.display = "inline-block";
            gameBtn.onclick = () => {
                gameAnswer.innerHTML = `<strong>Respuesta:</strong> ${blockData[step].respuesta}`;
                gameAnswer.style.display = "block";
                playVoice(blockData[step].respuesta);
            };
            await playVoice(blockData[step].pregunta);
        } else {
            block.innerHTML = `<div class="section-title">${step.toUpperCase()}:</div>${blockData[step]}`;
            await playVoice(blockData[step]);
        }

        // Pausa breve entre secciones
        await new Promise(r => setTimeout(r, 1500));
    }

    // Al finalizar todos los pasos de la sesión
    block.innerHTML = "¡Has completado la sesión de hoy!";
    restartBtn.style.display = "inline-block";
}

// Simplifica el inicio
async function startSession() {
    startBtn.style.display = "none";
    try {
        const response = await fetch("/session_content");
        const data = await response.json();
        // IMPORTANTE: 'data' ya es el objeto de la sesión
        showBlock(data); 
    } catch (error) {
        block.innerHTML = "Error al conectar con el servidor.";
        startBtn.style.display = "inline-block";
    }
}
