let lang = "es", active = false, currentMiniWorld="luz";

function speak(text){
    if(!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang==="es"?"es-ES":"en-US";
    u.pitch=1.0; u.rate=1.0; u.volume=1.0;
    speechSynthesis.speak(u);
}

function begin(){
    const age = parseInt(document.getElementById("age").value)||30;
    const state = document.getElementById("state").value||"presente";
    const destination = document.getElementById("destination").value||"bienestar";
    const mode = document.getElementById("mode").value;
    const offline = document.getElementById("offline").checked;

    fetch("/start", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({lang, age, state, destination, mode, offline})
    }).then(()=>{
        document.getElementById("intro").style.display="none";
        document.getElementById("options").style.display="block";
        active = true;
        speak(`Bienvenido, te acompañaré en tu camino hacia ${destination}`);
        run();
    });
}

function userDecision(action){
    speak(`Has decidido ${action} el obstáculo.`);
    // Enviar acción a backend si se quiere adaptar IA
}

function run(){
    setInterval(async ()=>{
        if(!active) return;
        const r = await fetch("/step");
        const d = await r.json();
        if(d.end){
            speak("La Vida Continúa…");
            active=false;
            return;
        }
        speak(d.message);
        currentMiniWorld=d.mini_world;
        updateLifeCanvas(d.position, currentMiniWorld);
    },5000);
}
