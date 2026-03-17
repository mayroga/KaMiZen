const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {

    streak:0,
    lastDay:null,
    nivel:1,

    disciplina:40,
    claridad:40,
    calma:40,

    estrategia:20,
    social:20,
    recursos:20

};


const streakEl = document.getElementById("streak");
const levelEl = document.getElementById("level");

const bars = {

disciplina:document.getElementById("disciplina-bar"),
claridad:document.getElementById("claridad-bar"),
calma:document.getElementById("calma-bar"),
estrategia:document.getElementById("estrategia-bar"),
social:document.getElementById("social-bar"),
recursos:document.getElementById("recursos-bar")

};


function limit(v){

if(v<0)return 0;
if(v>100)return 100;
return v;

}


function updatePanel(){

streakEl.innerHTML="Racha: "+userData.streak;
levelEl.innerHTML="Nivel: "+userData.nivel;

for(let k in bars){

userData[k]=limit(userData[k]);
bars[k].style.width=userData[k]+"%";

}

}


updatePanel();



function updateStreak(){

let today=new Date().toDateString();

if(userData.lastDay!==today){

userData.streak++;
userData.lastDay=today;

}

}



function playVoice(text){

return new Promise(resolve=>{

speechSynthesis.cancel();

let msg=new SpeechSynthesisUtterance(text);

msg.lang="es-ES";

msg.rate=0.9;

msg.onend=resolve;

speechSynthesis.speak(msg);

});

}



function breathingAnimation(){

let c=document.createElement("div");

c.className="breath-circle";

block.appendChild(c);

let inhale=true;

setInterval(()=>{

c.style.transform= inhale?"scale(1.5)":"scale(1)";
inhale=!inhale;

},4000);

}



function createOptions(b){

b.opciones.forEach((op,i)=>{

let btn=document.createElement("button");

btn.innerText=op;

btn.onclick=()=>{

if(i===b.correcta){

puntos+=5;

userData.disciplina+=2;
userData.claridad+=2;
userData.estrategia+=2;

}else{

userData.calma+=1;

}

updatePanel();

nextBtn.style.display="inline-block";

};

block.appendChild(btn);

});

}



async function showBlock(b){

block.innerHTML="";

document.body.style.background=b.color||"#0f172a";


if(b.tipo==="historia"){

block.innerHTML="<p>"+b.texto+"</p>";

await playVoice(b.texto);

nextBtn.style.display="inline-block";

return;

}


if(b.tipo==="respiracion"){

breathingAnimation();

await playVoice(b.texto);

setTimeout(()=>{

nextBtn.style.display="inline-block";

},20000);

return;

}


if(b.tipo==="decision"){

block.innerHTML="<h3>"+b.pregunta+"</h3>";

createOptions(b);

await playVoice(b.pregunta);

return;

}


if(b.tipo==="texto"){

block.innerHTML="<p>"+b.texto+"</p>";

await playVoice(b.texto);

nextBtn.style.display="inline-block";

return;

}


if(b.tipo==="recompensa"){

userData.disciplina+=3;
userData.calma+=3;
userData.social+=3;
userData.recursos+=3;

block.innerHTML="<h2>"+b.texto+"</h2>";

await playVoice(b.texto);

nextBtn.style.display="inline-block";

return;

}



if(b.tipo==="cierre"){

updateStreak();

puntos+=10;

if(puntos>50)userData.nivel++;

localStorage.setItem("kamizenData",JSON.stringify(userData));

updatePanel();

restartBtn.style.display="inline-block";

await playVoice(b.texto);

return;

}

}



function nextBlock(){

nextBtn.style.display="none";

current++;

if(current<bloques.length){

showBlock(bloques[current]);

}

}



let currentSessionIndex=0;



startBtn.addEventListener("click",async()=>{

startBtn.style.display="none";

const res=await fetch("/session_content");

const data=await res.json();

const sesiones=data.sesiones;

currentSessionIndex=Math.floor(Math.random()*sesiones.length);

bloques=sesiones[currentSessionIndex].bloques;

current=0;

showBlock(bloques[0]);

});



nextBtn.addEventListener("click",nextBlock);

restartBtn.addEventListener("click",()=>location.reload());
