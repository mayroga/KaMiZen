let lang = "es";
let level = "day";
let uid = "";
let city = "";

// ================= LOGIN =================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/admin/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });

    if(res.ok){
        const data = await res.json();
        alert(data.message);
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        startLevel("day");
    } else {
        const err = await res.json();
        alert("Error: " + err.detail);
    }
}

// ================= VOZ =================
function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang === "es" ? "es-ES" : "en-US";
    msg.voice = speechSynthesis.getVoices().find(v => v.lang.includes(msg.lang));
    speechSynthesis.speak(msg);
}

// ================= NIVEL =================
function startLevel(l){
    level = l;
    resetAvatar();
    drawMap(city);
    startTimeline();
}

// ================= AVATAR =================
function resetAvatar(){
    const canvas = document.getElementById("lifeCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 15, 0, 2*Math.PI);
    ctx.fill();
}

// ================= MAPA =================
function drawMap(cityName){
    city = cityName || "Miami";
    const canvas = document.getElementById("lifeCanvas");
    const ctx = canvas.getContext("2d");

    // Fondo simple demo para tiles
    ctx.fillStyle = "#cceeff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    ctx.fillRect(50, 50, 100, 100); // Demo tile

    // Avatar en centro
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 15, 0, 2*Math.PI);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.fillText("Avatar", canvas.width/2 - 20, canvas.height/2 - 20);
}

// ================= CONTROLES =================
document.getElementById("btnRespirar").onclick = () => {
    speak(lang==="es"?"Respiras profundamente.":"Take a deep breath.");
};

document.getElementById("btnEstirarse").onclick = () => {
    speak(lang==="es"?"Te estiras y te relajas.":"Stretch and relax.");
};

document.getElementById("btnCerrarOjos").onclick = () => {
    speak(lang==="es"?"Cierras los ojos y sientes paz.":"Close your eyes and feel calm.");
};

// ================= IDIOMA =================
function setLang(l){
    lang = l;
}
