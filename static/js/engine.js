const { jsPDF } = window.jspdf;

let session = {
    userName: "",
    timeLeft: 900,
    isRunning: false,
    wordsSeen: [],
    storiesRead: [],
    stats: { oportunity: 0, obstacles: 0, neutral: 0 },
    wordsData: [],
    storiesData: []
};

// 1. Inicialización
async function initApp() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value.trim()) return alert("Por favor, ingresa tu nombre");
    
    session.userName = nameInput.value.trim().split(" ")[0]; // Solo el primer nombre
    document.getElementById('display-name').innerText = session.userName;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';
    document.getElementById('master-clock').style.visibility = 'visible';

    await loadResources();
    speak(`Welcome ${session.userName}. Let's begin your wisdom training.`);
    showStory(); 
}

async function loadResources() {
    const wRes = await fetch('/data/kamizen_data.json');
    const sRes = await fetch('/data/stories.json');
    const wJson = await wRes.json();
    const sJson = await sRes.json();
    session.wordsData = wJson.words;
    session.storiesData = sJson.stories;
}

// 2. Control de Tiempo
function startTimer() {
    const timerInterval = setInterval(() => {
        if (session.timeLeft <= 0) {
            clearInterval(timerInterval);
            finishSession();
            return;
        }
        session.timeLeft--;
        updateClock();
        
        if (session.timeLeft % 300 === 0) triggerBreathing(); // Cada 5 min
    }, 1000);
}

function updateClock() {
    const m = Math.floor(session.timeLeft / 60);
    const s = session.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
}

// 3. Sistema de Historias
function showStory() {
    session.isRunning = false;
    const storyBox = document.getElementById('story-box');
    const idx = Math.floor(Math.random() * session.storiesData.length);
    const story = session.storiesData.splice(idx, 1)[0];
    
    session.storiesRead.push(story.t);
    document.getElementById('story-title').innerText = story.t;
    document.getElementById('story-content').innerText = story.en;
    storyBox.style.display = 'flex';
    
    speak(story.t + ". " + story.en);
}

function closeStory() {
    document.getElementById('story-box').style.display = 'none';
    if (!session.isRunning) {
        session.isRunning = true;
        startTimer();
        gameLoop();
    }
}

// 4. Bucle de Juego
function gameLoop() {
    if (!session.isRunning || session.timeLeft <= 0) return;

    const data = session.wordsData[Math.floor(Math.random() * session.wordsData.length)];
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = data.text;
    el.style.left = (Math.random() * 70 + 15) + "vw";
    
    // Paisaje dinámico
    const world = document.getElementById('game-world');
    world.className = '';
    if (["NEGOCIO", "DINERO"].includes(data.type)) world.classList.add('landscape-city');
    if (["SALUD", "BIENESTAR"].includes(data.type)) world.classList.add('landscape-zen');

    el.onclick = () => {
        speak(data.text);
        session.wordsSeen.push(data.text);
        if (data.type === 'OPORTUNIDAD') session.stats.oportunity++;
        else if (data.type === 'OBSTACULO') session.stats.obstacles++;
        
        el.style.transform = "scale(2)";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 200);
    };

    document.getElementById('game-world').appendChild(el);
    setTimeout(gameLoop, 3500);
}

// 5. Respiración (Silencio)
async function triggerBreathing() {
    session.isRunning = false;
    const overlay = document.getElementById('breath-overlay');
    overlay.style.display = 'flex';
    for (let i = 0; i < 2; i++) {
        overlay.innerText = "INHALE"; overlay.style.transform = "translate(-50%, -50%) scale(1.4)";
        await new Promise(r => setTimeout(r, 4000));
        overlay.innerText = "EXHALE"; overlay.style.transform = "translate(-50%, -50%) scale(1)";
        await new Promise(r => setTimeout(r, 4000));
    }
    overlay.style.display = 'none';
    session.isRunning = true;
}

// 6. Finalización y PDF
function finishSession() {
    session.isRunning = false;
    speak("Training complete. Generating your progress report.");
    generatePDF();
    
    document.body.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100vh; align-items:center; justify-content:center; background:black; text-align:center;">
            <h1 style="color:var(--blue)">SESIÓN FINALIZADA</h1>
            <p style="font-size:1.5rem">Buen trabajo, ${session.userName}. Tu reporte se ha descargado.</p>
            <p>El sistema se cerrará automáticamente.</p>
        </div>
    `;
    setTimeout(() => { window.location.reload(); }, 10000);
}

function generatePDF() {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(22); doc.setTextColor(0, 212, 255);
    doc.text("REPORTE DE ASESORÍA - AL CIELO", 20, 30);
    
    doc.setFontSize(16); doc.setTextColor(0, 0, 0);
    doc.text(`Estudiante: ${session.userName}`, 20, 50);
    doc.text(`Fecha: ${date}`, 20, 60);

    doc.setFontSize(14);
    doc.text("RESUMEN DEL ENTRENAMIENTO:", 20, 80);
    doc.text(`- Oportunidades Identificadas: ${session.stats.oportunity}`, 30, 90);
    doc.text(`- Obstáculos Reconocidos: ${session.stats.obstacles}`, 30, 100);
    
    doc.text("HISTORIAS DE SABIDURÍA TRABAJADAS:", 20, 120);
    session.storiesRead.forEach((title, i) => {
        doc.text(`${i+1}. ${title}`, 30, 130 + (i * 10));
    });

    doc.setFontSize(10);
    doc.text("Este documento certifica 15 minutos de entrenamiento en enfoque y valores.", 20, 280);
    
    doc.save(`Reporte_AL_CIELO_${session.userName}.pdf`);
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}
