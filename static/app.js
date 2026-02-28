let token = new URLSearchParams(window.location.search).get("token");
let ws;
let sessionEnd;

async function buy(){
    let res = await fetch("/create-checkout", {method:"POST"});
    let data = await res.json();
    window.location = data.url;
}

async function adminAccess(){
    let u = prompt("Username:");
    let p = prompt("Password:");
    let fd = new FormData();
    fd.append("username", u);
    fd.append("password", p);

    let res = await fetch("/admin-login",{method:"POST",body:fd});
    if(res.ok){
        let data = await res.json();
        window.location="/session?token="+data.token;
    } else alert("Acceso denegado");
}

async function countdown(){
    let res = await fetch("/next-session");
    let data = await res.json();
    let next = new Date(data.next);

    setInterval(()=>{
        let now = new Date();
        let diff = next - now;
        let h = Math.floor(diff/1000/60/60);
        let m = Math.floor(diff/1000/60%60);
        let s = Math.floor(diff/1000%60);
        document.getElementById("countdown").innerText =
        "Próxima sesión en: "+h+"h "+m+"m "+s+"s";
    },1000);
}

async function initSession(){
    let res = await fetch("/audio-file");
    let data = await res.json();
    document.getElementById("audio").src = data.file;

    ws = new WebSocket("wss://" + window.location.host + "/ws?token="+token);

    ws.onmessage = function(e){
        let d = JSON.parse(e.data);
        let box = document.getElementById("chat-box");
        box.innerHTML += "<div>"+d.message+"</div>";
        box.scrollTop = box.scrollHeight;
    };

    loadQuestion();
    startTimer();
}

async function loadQuestion(){
    let res = await fetch("/next-question?token="+token);
    let data = await res.json();
    document.getElementById("phase-label").innerText="Fase "+data.phase;
    document.getElementById("question").innerText=data.question;
}

function submitAnswer(){
    document.getElementById("feedback").innerText="Subiendo nivel...";
    setTimeout(()=>{
        loadQuestion();
        document.getElementById("feedback").innerText=
        "Perfecto. Hoy avanzaste más que muchos.";
    },1500);
}

function sendChat(){
    let input=document.getElementById("chat-input");
    ws.send(JSON.stringify({message:input.value}));
    input.value="";
}

function startTimer(){
    sessionEnd = new Date(new Date().getTime()+10*60000);
    setInterval(()=>{
        if(new Date()>sessionEnd){
            document.body.innerHTML=`
            <h1>Sesión terminada</h1>
            <h2>Los que no subieron nivel hoy, comienzan mañana en desventaja.</h2>
            <h3>Asegura tu lugar en la próxima sesión.</h3>
            `;
        }
    },1000);
}

if(document.getElementById("countdown")) countdown();
if(document.getElementById("audio")) initSession();
