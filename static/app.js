let lang = "es";
let level = "day";
let uid = "";

// ================= LOGIN ADMIN =================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({username, password})
    });

    if(res.ok){
        alert("Login exitoso. Acceso gratuito habilitado.");
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        startLevel("day"); // Admin siempre inicia Nivel 1
    } else {
        const err = await res.json();
        alert("Error: " + err.detail);
    }
}

// ================= PAGO CLIENTES =================
async function pay(lvl){
    level = lvl;
    const price = lvl === "day" ? 9.99 : 99.99;

    const res = await fetch("/create-checkout-session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            level: lvl,
            price: price,
            success: window.location.origin + "/life?level=" + lvl,
            cancel: window.location.href
        })
    });

    const data = await res.json();
    window.location.href = data.url;
}

// ================= NIVEL =================
function startLevel(lvl){
    level = lvl;
    resetAvatar();

    if(level === "day"){
        generateLifeMapLevel1();
        drawMapLevel1();
    } else {
        generateLifeMapLevel2();
        drawMapLevel2();
    }

    startTimeline();
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

// ================= VOZ =================
function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang==="es" ? "es-ES" : "en-US";
    msg.voice = speechSynthesis.getVoices().find(v => v.lang.includes(msg.lang));
    speechSynthesis.speak(msg);
}
