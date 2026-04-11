// =====================================
// MAYKAMI V5 - TERAPIA REAL
// RISOTERAPIA + TVID + ADULTOS MAYORES
// =====================================

let user = {
    age: 0,
    state: "",
    phase: "roto"
};

let state = {
    mental: 100,
    stress: 50,
    identity: 0
};

// ===============================
// START
// ===============================
function start(){
    user.age = document.getElementById("age").value;
    user.state = document.getElementById("state").value;

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    nextScene();
}

// ===============================
// ESCENAS HUMANAS
// ===============================
function nextScene(){

    let text = "";
    let options = [];

    // 👴 ADULTOS MAYORES (CLAVE)
    if(user.state === "soledad"){
        text = "Hoy nadie te llamó. El silencio pesa más de lo normal.";

        options = [
            {txt:"Aceptar y respirar (TDB)", tvid:"TDB", good:true},
            {txt:"Encender TV para olvidar (TDM)", tvid:"TDM", good:false},
            {txt:"Recordar un momento feliz (TDN)", tvid:"TDN", good:true}
        ];
    }

    if(user.state === "perdida"){
        text = "Piensas en alguien que ya no está. El vacío aparece.";

        options = [
            {txt:"Aceptar el dolor (TDB)", tvid:"TDB", good:true},
            {txt:"Evitar pensar (TDM)", tvid:"TDM", good:false},
            {txt:"Hablarle en tu mente (TDN)", tvid:"TDN", good:true}
        ];
    }

    if(user.state === "estres"){
        text = "Sientes presión en el pecho. Tu mente no se detiene.";

        options = [
            {txt:"Respirar profundo (TDB)", tvid:"TDB", good:true},
            {txt:"Reaccionar con enojo (TDG)", tvid:"TDG", good:false},
            {txt:"Buscar apoyo (TDP)", tvid:"TDP", good:true}
        ];
    }

    renderScene(text, options);
}

// ===============================
// RENDER
// ===============================
function renderScene(text, options){
    const container = document.getElementById("options");
    container.innerHTML = "";

    document.getElementById("text-content").innerText = text;

    options.forEach(opt=>{
        const btn = document.createElement("button");
        btn.innerText = opt.txt;

        btn.onclick = () => applyDecision(opt);

        container.appendChild(btn);
    });
}

// ===============================
// DECISIÓN + TERAPIA
// ===============================
function applyDecision(opt){

    if(opt.good){
        state.mental += 5;
        state.identity += 10;
    }else{
        state.stress += 10;
        state.mental -= 5;
    }

    evolve();

    // 🔥 ACTIVAR RISOTERAPIA
    runTherapy(opt.tvid);

    // IA BACKEND
    fetch("/judge",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            decision: opt.tvid,
            state: state
        })
    });
}

// ===============================
// 😂 RISOTERAPIA REAL
// ===============================
function runTherapy(tvid){

    let text = "";

    // 🔥 TU MÉTODO (DUALIDAD)
    if(tvid === "TDB"){
        text = "Respira… y sonríe suave. Todo está bien por ahora.";
    }

    if(tvid === "TDM"){
        text = "Incluso escapando… sonríe. Observa sin juzgar.";
    }

    if(tvid === "TDN"){
        text = "Recuerda algo simple… sonríe como niño.";
    }

    if(tvid === "TDG"){
        text = "Siente la intensidad… ahora suéltala con una risa corta.";
    }

    showTherapy(text);
}

// ===============================
// UI TERAPIA
// ===============================
function showTherapy(msg){

    document.getElementById("text-content").innerText = msg;

    let t = 5;
    let timer = document.getElementById("timer");
    let circle = document.getElementById("breath-circle");

    circle.style.display = "flex";
    circle.classList.add("breathing");

    timer.innerText = t;

    let interval = setInterval(()=>{
        t--;
        timer.innerText = t;

        if(t <= 0){
            clearInterval(interval);
            circle.style.display = "none";
            nextScene();
        }
    },1000);
}

// ===============================
// EVOLUCIÓN
// ===============================
function evolve(){

    if(state.identity > 30){
        user.phase = "consciente";
    }

    if(state.identity > 70){
        user.phase = "fuerte";
    }
}
