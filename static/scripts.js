// UID persistente
let uid = localStorage.getItem("aura_uid");
if (!uid) {
    uid = Math.random().toString(36).substring(2,15);
    localStorage.setItem("aura_uid", uid);
}

let ws = new WebSocket(`wss://kamizen.onrender.com/ws/${uid}`);
let sessionData = {};

ws.onopen = () => {
    console.log("KaMiZen conectado");
};

ws.onmessage = (event) => {

    const msg = JSON.parse(event.data);

    if(msg.type === "init"){
        sessionData = msg.content;

        // mostrar contenido inmediatamente
        document.getElementById("historia").innerText = sessionData.historia;
        document.getElementById("ejercicio").innerText = sessionData.ejercicio;
        document.getElementById("bienestar").innerText = sessionData.bienestar;

        startSession();
    }

    if(msg.type === "next"){
        sessionData = msg.content;

        document.getElementById("historia").innerText = sessionData.historia;
        document.getElementById("ejercicio").innerText = sessionData.ejercicio;
        document.getElementById("bienestar").innerText = sessionData.bienestar;

        document.getElementById("status").innerText = "Nuevo contenido KaMiZen";
    }

};

ws.onerror = (err)=>{
    console.log("Error WS",err);
};

ws.onclose = ()=>{
    console.log("WS cerrado");
};



// temporizador
let timeLeft = 600;
let timer;

function startSession(){

    document.getElementById("status").innerText="Sesión KaMiZen iniciada";

    timer=setInterval(()=>{

        timeLeft--;

        const min=Math.floor(timeLeft/60);
        const sec=timeLeft%60;

        document.getElementById("time").innerText =
        `${min}:${sec<10?"0":""}${sec}`;

        if(timeLeft<=0){

            clearInterval(timer);

            document.getElementById("status").innerText=
            "Sesión completada";

        }

    },1000);

}



// botón siguiente
function nextContent(){

    if(ws.readyState===1){

        ws.send(JSON.stringify({
            action:"next"
        }));

    }

}
