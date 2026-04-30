const { jsPDF } = window.jspdf;

let app = {
    name: "", lang: "en", sound: true,
    time: 900, active: false,
    dataWords: [], dataStories: [],
    log: { stories: [], caught: [] }
};

// Iniciar sesión
async function initApp() {
    const val = document.getElementById('user-name').value.trim();
    if (!val) return;
    
    app.name = val.split(" ")[0];
    document.getElementById('user-display').innerText = app.name;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    await loadData();
    narrate(`Hello ${app.name}, welcome to your session.`);
    showStory();
}

async function loadData() {
    try {
        const [w, s] = await Promise.all([fetch('/data/kamizen_data.json'), fetch('/data/stories.json')]);
        app.dataWords = (await w.json()).words;
        app.dataStories = (await s.json()).stories;
    } catch (e) { console.error("Data missing"); }
}

// Sistema de Historias
function showStory() {
    app.active = false;
    const item = app.dataStories[Math.floor(Math.random() * app.dataStories.length)];
    app.log.stories.push(item.t);

    document.getElementById('st-title').innerText = item.t;
    document.getElementById('st-body').innerText = (app.lang === "en") ? item.en : item.es;
    document.getElementById('story-box').style.display = 'flex';
    
    narrate(item.t + ". " + (app.lang === "en" ? item.en : item.es));
}

function closeStory() {
    document.getElementById('story-box').style.display = 'none';
    if (!app.active) {
        app.active = true;
        startCountdown();
        spawnWords();
    }
}

// Reloj y Caída de Palabras
function startCountdown() {
    const clock = setInterval(() => {
        if (app.time <= 0) { clearInterval(clock); finish(); return; }
        app.time--;
        const m = Math.floor(app.time / 60);
        const s = app.time % 60;
        document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}

function spawnWords() {
    if (!app.active || app.time <= 0) return;
    
    const w = app.dataWords[Math.floor(Math.random() * app.dataWords.length)];
    const div = document.createElement('div');
    div.className = 'word';
    div.innerText = w.text;
    div.style.left = (Math.random() * 80 + 5) + "vw";
    
    div.onclick = () => {
        app.log.caught.push(w.text);
        narrate(w.text);
        div.remove();
    };

    document.getElementById('game-world').appendChild(div);
    setTimeout(spawnWords, 3000);
}

// Botones
function changeLang() {
    app.lang = (app.lang === "en") ? "es" : "en";
    alert("Language: " + app.lang.toUpperCase());
}

function toggleMute() {
    app.sound = !app.sound;
    document.getElementById('audio-btn').innerText = app.sound ? "AUDIO: ON" : "AUDIO: OFF";
}

function generatePDF() {
    const doc = new jsPDF();
    doc.text("AL CIELO - ADVISORY REPORT", 20, 20);
    doc.text(`Student: ${app.name}`, 20, 40);
    doc.text("Lessons today:", 20, 60);
    app.log.stories.forEach((s, i) => doc.text(`- ${s}`, 30, 70 + (i * 10)));
    doc.save(`Al_Cielo_${app.name}.pdf`);
}

function narrate(t) {
    if (!app.sound) return;
    window.speechSynthesis.cancel();
    const m = new SpeechSynthesisUtterance(t);
    m.lang = (app.lang === "en") ? "en-US" : "es-ES";
    window.speechSynthesis.speak(m);
}

function finish() {
    app.active = false;
    generatePDF();
    document.body.innerHTML = "<div style='height:100vh;display:flex;align-items:center;justify-content:center;'><h1>TIME FINISHED. CHECK YOUR PDF.</h1></div>";
}
