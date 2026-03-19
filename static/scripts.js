const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");

const block = document.getElementById("block");

const circle = document.getElementById("circle");

let bloques = [];
let current = 0;

let userData = JSON.parse(localStorage.getItem("kamizen")) || {

streak:0,
nivel:1,
disciplina:40,
claridad:50,
calma:30

};

function breathe(){

let inhale=true;

setInterval(()=>{

circle.style.transform = inhale ? "scale(1.5)" : "scale(1)";

inhale=!inhale;

},4000);

}

breathe();


function speak(text){

return new Promise(resolve=>{

if(!text){

resolve();

return;

}

speechSynthesis.cancel();

let msg = new SpeechSynthesisUtterance(text);

msg.lang="es-ES";

msg.rate=0.9;

msg.onend=()=>resolve();

msg.onerror=()=>resolve();

speechSynthesis.speak(msg);

});

}


function updateBars(){

document.getElementById("disciplina-bar").style.width=userData.disciplina+"%";

document.getElementById("claridad-bar").style.width=userData.claridad+"%";

document.getElementById("calma-bar").style.width=userData.calma+"%";

}

updateBars();


async function showBlock(b){

nextBtn.style.display="none";

block.innerHTML="";

if(!b){

block.innerHTML="Continuar";

nextBtn.style.display="block";

return;

}

let text = b.texto || b.pregunta || "Continuar";

block.innerHTML="<p>"+text+"</p>";

await speak(text);


if(b.opciones){

b.opciones.forEach(op=>{

let btn=document.createElement("button");

btn.innerText=op;

btn.onclick=()=>{

nextBtn.style.display="block";

};

block.appendChild(btn);

});

}else{

nextBtn.style.display="block";

}

}


function nextBlock(){

current++;

if(current<bloques.length){

showBlock(bloques[current]);

}else{

restartBtn.style.display="block";

}

}


startBtn.onclick=async()=>{

startBtn.style.display="none";

const res = await fetch("/session_content");

const data = await res.json();

let sesiones=data.sesiones;

let s = sesiones[Math.floor(Math.random()*sesiones.length)];

bloques=s.bloques;

current=0;

showBlock(bloques[0]);

};


nextBtn.onclick=nextBlock;

restartBtn.onclick=()=>location.reload();
