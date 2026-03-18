const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const clearBtn = document.getElementById("clear-btn");

const block = document.getElementById("block");

let bloques = [];
let currentIdx = 0;

let tempText = "";

let skipFlag = false;



function playVoice(text){

return new Promise(resolve=>{

speechSynthesis.cancel();

let msg = new SpeechSynthesisUtterance(text);

msg.lang="es-ES";

msg.rate=0.9;

msg.onend=resolve;

speechSynthesis.speak(msg);

});

}



function wait(ms){

return new Promise(r=>setTimeout(r,ms));

}



async function showBlock(b){

skipFlag=false;

block.innerHTML="";

nextBtn.style.display="none";
skipBtn.style.display="block";
clearBtn.style.display="none";

if(currentIdx>0)
backBtn.style.display="block";
else
backBtn.style.display="none";


document.body.style.background=b.color || "#020617";



if(b.tipo==="texto"){

block.innerHTML="<p>"+b.texto+"</p>";

await playVoice(b.texto);

finishBlock();

}



else if(b.tipo==="escribir"){

block.innerHTML=

"<p>"+b.texto+"</p>"+

"<textarea id='userInput' placeholder='"+(b.placeholder||"Escribe si deseas")+"'></textarea>";

clearBtn.style.display="block";

await playVoice(b.texto);

finishBlock();

}



else if(b.tipo==="respiracion"){

block.innerHTML=

"<p>"+b.instrucciones+"</p>"+

"<div class='breath-circle' id='circle'></div>";

let circle=document.getElementById("circle");

for(let i=0;i<3;i++){

circle.style.transform="scale(1.8)";
await wait(3000);

circle.style.transform="scale(1)";
await wait(3000);

}

finishBlock();

}



}



function finishBlock(){

nextBtn.style.display="block";

}



nextBtn.onclick=()=>{

currentIdx++;

if(currentIdx<bloques.length){

showBlock(bloques[currentIdx]);

}else{

block.innerHTML="Sesión terminada";

restartBtn.style.display="block";

}

};



backBtn.onclick=()=>{

if(currentIdx>0){

currentIdx--;

showBlock(bloques[currentIdx]);

}

};



clearBtn.onclick=()=>{

let t=document.getElementById("userInput");

if(t) t.value="";

};



startBtn.onclick=async()=>{

startBtn.style.display="none";

let res=await fetch("/session_content");

let data=await res.json();

bloques=data.sesiones[0].bloques;

currentIdx=0;

showBlock(bloques[0]);

};



restartBtn.onclick=()=>location.reload();
