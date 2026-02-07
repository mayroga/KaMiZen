let uid = null;
let lang = "es";
let voice;
let startTime = null;

function loadVoice(){
    const voices = speechSynthesis.getVoices();
    voice = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes("male")) || voices[0];
}
speechSynthesis.onvoiceschanged = loadVoice;

function speak(text){
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.voice = voice;
    u.rate = 0.95;
    speechSynthesis.speak(u);
}

function acceptLegal(){
    document.getElementById("legal").style.display="none";
    document.getElementById("intro").style.display="block";
}

function begin(){
    lang = document.getElementById("lang").value;
    const city = document.getElementById("city").value;
    const age = document.getElementById("age").value;
    const profile = document.getElementById("profile").value;

    fetch("/start",{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({city, age, profile, lang})
    })
    .then(r=>r.json())
    .then(d=>{
        uid = d.uid;
        startTime = Date.now();
        document.getElementById("intro").style.display="none";
        run();
    });
}

function run(){
    const interval = setInterval(()=>{
        const elapsed = (Date.now() - startTime)/60000; // minutos
        if(elapsed >= 10){ 
            clearInterval(interval);
            speak(lang==="es"?"Tu sesión de 10 minutos ha terminado. Recuerda que esto es un acompañamiento de bienestar general, no terapia.":"Your 10-minute session has ended. Remember, this is general wellness guidance, not therapy.");
            return;
        }

        fetch(`/step/${uid}`)
        .then(r=>r.json())
        .then(d=>{
            speak(d.text);
            animateText(d.text, d.story, d.action);
            moveMap(d.move, d.mini_world, d.obstacle, d.choice, d.mini_game);
        });
    }, 8000);
}

function animateText(text, story, action){
    const el = document.getElementById("floatingText");
    el.innerHTML = `<p>${text}</p><p>${story}</p><p>${action}</p>`;
    el.className = "glow";
}

function showMiniGame(game){
    const mg = document.getElementById("miniGame");
    mg.innerHTML = `<p>${game}</p>
    <button onclick="resolveMiniGame(true)">✔</button>
    <button onclick="resolveMiniGame(false)">✖</button>`;
}

function resolveMiniGame(ans){
    const mg = document.getElementById("miniGame");
    mg.innerHTML = ans ? "<p>¡Bien hecho!</p>" : "<p>Intenta de nuevo</p>";
}
