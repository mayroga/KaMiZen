let uid = null;
let lang = "es";
let voice;

function loadVoice() {
    const voices = speechSynthesis.getVoices();
    voice = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes("male")) || voices[0];
}
speechSynthesis.onvoiceschanged = loadVoice;

function speak(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.voice = voice;
    u.rate = 0.95;
    speechSynthesis.speak(u);
}

function begin() {
    lang = document.getElementById("lang").value;
    const city = document.getElementById("city").value;
    const age = document.getElementById("age").value;
    const profile = document.getElementById("profile").value;
    const username = document.getElementById("username")?.value || "";
    const password = document.getElementById("password")?.value || "";

    fetch("/start", {
        method: "POST",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ city, age, profile, mode: "day", lang, username, password })
    })
    .then(r => r.json())
    .then(d => {
        uid = d.uid;
        document.getElementById("intro").style.display = "none";
        run();
    });
}

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.8;
let x = 50, y = canvas.height / 2;

function moveMap(step, obstacle, choice, mini_game) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#111";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Camino
    ctx.strokeStyle="#00ccff";
    ctx.lineWidth=6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + step, y + Math.random()*20-10);
    ctx.stroke();
    x += step;

    // Usuario
    ctx.fillStyle="#ffcc00";
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI*2);
    ctx.fill();

    // Obstáculo
    if(obstacle){
        ctx.fillStyle="rgba(255,0,0,0.4)";
        ctx.fillRect(x+80, y-30, 40, 60);
    }

    // Mini-juego
    if(mini_game) showMiniGame(mini_game);
}

function run(){
    const interval = setInterval(()=>{
        fetch(`/step/${uid}`)
        .then(r=>r.json())
        .then(d=>{
            speak(d.text);
            animateText(d.text, d.micro_action);
            moveMap(d.move, d.obstacle, d.choice, d.mini_game);
        });
    }, 8000);
}

function animateText(text, micro_action){
    const el = document.getElementById("floatingText");
    el.innerHTML = `<p>${text}</p><p>${micro_action}</p>`;
}

function showMiniGame(game){
    const mg = document.getElementById("miniGame");
    mg.innerHTML = `<p>${game.question}</p>
    <button onclick="resolveMiniGame('${game.answer}')">Ver respuesta</button>`;
}

function resolveMiniGame(ans){
    const mg = document.getElementById("miniGame");
    mg.innerHTML += `<p>Respuesta correcta: ${ans}</p>`;
}
