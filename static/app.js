let lang = "es";
let level = "day";
let uid = "";

// ================= LOGIN =================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/admin/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password})
        });

        if(res.ok){
            const data = await res.json();
            alert("Login exitoso: " + data.role);
            document.getElementById("loginBox").style.display = "none";
            document.getElementById("gameArea").style.display = "block";
            startLevel("day");
        } else {
            const err = await res.json();
            alert("Error: " + err.detail);
        }
    } catch(e) {
        alert("Error en conexión: " + e);
    }
}

// ================= NIVEL =================
async function startLevel(l){
    level = l;
    resetAvatar();
    await generateLifeMap();
    drawMap();
    startTimeline();
}

// ================= VOZ =================
function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang === "es" ? "es-ES" : "en-US";
    msg.voice = speechSynthesis.getVoices().find(v => v.lang.includes(msg.lang));
    speechSynthesis.speak(msg);
}

// ================= MICROACCIONES =================
document.getElementById("btnRespirar").onclick = () => {
    avatarReact('respirar');
    speak(lang==="es"?"Respiras profundamente.":"Take a deep breath.");
};
document.getElementById("btnEstirarse").onclick = () => {
    avatarReact('estirarse');
    speak(lang==="es"?"Te estiras y te relajas.":"Stretch and relax.");
};
document.getElementById("btnCerrarOjos").onclick = () => {
    avatarReact('cerrarOjos');
    speak(lang==="es"?"Cierras los ojos y sientes paz.":"Close your eyes and feel calm.");
};

// ================= MAPA SIMULADO =================
async function generateLifeMap(){
    // Aquí puedes poner tu lógica para dibujar mapa, avatar, paisajes o canvas
    const canvas = document.getElementById("lifeCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 600;

    ctx.fillStyle = "#87CEEB"; // cielo
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "green"; // tierra
    ctx.fillRect(0,canvas.height-100,canvas.width,100);

    // Avatar central
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height-150, 20, 0, 2*Math.PI);
    ctx.fill();
}

function drawMap(){
    // Lógica adicional si quieres mover avatar o elementos
}

function startTimeline(){
    // Aquí se podría manejar animaciones, pasos de nivel, etc.
}

function resetAvatar(){
    // Reset del avatar antes de comenzar nivel
}

function avatarReact(action){
    console.log("Avatar acción:", action);
}
