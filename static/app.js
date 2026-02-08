let lang = "es";
let level = "day";
let uid = "";

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
        alert("Login exitoso: " + data.role);
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        startLevel("day");
    } else {
        const err = await res.json();
        alert("Error: " + err.detail);
    }
}

// ================= INVITADO =================
async function startGuest(){
    const age = document.getElementById("guestAge").value;
    const mood = document.getElementById("guestMood").value;
    const city = document.getElementById("guestCity").value;

    const res = await fetch("/life/guide", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({age, mood, city, lang, level})
    });

    if(res.ok){
        const data = await res.json();
        uid = data.session_id;
        speak(data.message);
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        startLevel(level);
    } else {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err));
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
    generateLifeMapLevel2();
    drawMapLevel2();
    startTimeline();
}

// ================= CONTROLES MICROACCIONES =================
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
