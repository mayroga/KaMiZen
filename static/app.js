// ======= Variables globales =======
let lang = "es";
let level = "day";
let uid = "";

// ======= Funciones de idioma =======
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnEn").onclick = () => setLang('en');
    document.getElementById("btnEs").onclick = () => setLang('es');

    document.getElementById("btnDay").onclick = () => pay('day');
    document.getElementById("btnNight").onclick = () => pay('night');

    document.getElementById("btnStart").onclick = () => startLife();
});

function setLang(l){
    lang = l;
    speechSynthesis.cancel();
}

// ======= Voz adaptativa =======
function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang==="es"?"es-ES":"en-US";
    msg.voice = speechSynthesis.getVoices().find(v=>v.lang.includes(msg.lang));
    speechSynthesis.speak(msg);
}

// ======= Inicio de sesión / guía de vida =======
async function startLife(){
    const age = document.getElementById("age").value;
    const mood = document.getElementById("mood").value;
    const city = document.getElementById("city").value;

    const res = await fetch("/life/guide",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({age,mood,lang,level,city})
    });

    const data = await res.json();
    uid = data.session_id;
    speak(data.message);

    // ======= Activar Nivel 1 o Nivel 2 según level =======
    if(level === "day"){
        generateLifeMap();      // Nivel 1
        drawMap();
        moveAvatar();
    } else {
        generateLifeMapLevel2(); // Nivel 2
        drawMapLevel2();
        moveAvatarLevel2();
        startTimeline();         // Eventos progresivos Nivel 2
    }
}

// ======= Pagos Stripe =======
async function pay(lvl){
    level = lvl;
    const price = lvl==="day"?9.99:99.99;

    const res = await fetch("/create-checkout-session",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            level:lvl,
            price:price,
            success:window.location.href,
            cancel:window.location.href
        })
    });

    const data = await res.json();
    window.location.href = data.url;
}

// ======= Microacciones (Nivel 1) =======
document.addEventListener("DOMContentLoaded", () => {
    const btnResp = document.getElementById("btnRespirar");
    const btnEst = document.getElementById("btnEstirarse");
    const btnOjos = document.getElementById("btnCerrarOjos");

    if(btnResp) btnResp.onclick = () => { avatarReact('respirar'); speak(lang==="es"?"Respiras profundamente.":"Take a deep breath."); };
    if(btnEst) btnEst.onclick = () => { avatarReact('estirarse'); speak(lang==="es"?"Te estiras y te relajas.":"Stretch and relax."); };
    if(btnOjos) btnOjos.onclick = () => { avatarReact('cerrarOjos'); speak(lang==="es"?"Cierras los ojos y sientes paz.":"Close your eyes and feel calm."); };
});
