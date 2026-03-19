const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let i = 0;

let fileIdx = 0;
let sesionIdx = 0;

let totalSesiones = 0;



function speak(t){
return new Promise(r=>{
speechSynthesis.cancel()
let m=new SpeechSynthesisUtterance(t)
m.lang="es-ES"
m.onend=r
speechSynthesis.speak(m)
})
}



function respirar(sec){

let c=document.createElement("div")
c.className="breath-circle"

block.appendChild(c)

let b=true

let inter=setInterval(()=>{

c.style.transform=b?"scale(1.6)":"scale(1)"

b=!b

},4000)

setTimeout(()=>{

clearInterval(inter)

nextBtn.style.display="block"

},sec*1000)

}



async function show(b){

block.innerHTML=""

nextBtn.style.display="none"
restartBtn.style.display="none"

if(!b){
restartBtn.style.display="block"
return
}

if(b.color){
document.body.style.background=b.color
}

if(b.texto){

let p=document.createElement("p")
p.innerText=b.texto
block.appendChild(p)

await speak(b.texto)
}

if(b.pregunta){

let h=document.createElement("h3")
h.innerText=b.pregunta
block.appendChild(h)

await speak(b.pregunta)
}

if(b.opciones){

b.opciones.forEach(o=>{

let btn=document.createElement("button")

btn.innerText=o

btn.onclick=()=>{
nextBtn.style.display="block"
}

block.appendChild(btn)

})

return
}

if(b.tipo==="respiracion"){

respirar(b.duracion || 20)

return
}

if(b.tipo==="cierre"){

restartBtn.style.display="block"

return
}

nextBtn.style.display="block"

}



function nextBlock(){

i++

if(i < bloques.length){

show(bloques[i])

}else{

nextSession()

}

}



function nextSession(){

sesionIdx++

if(sesionIdx >= totalSesiones){

sesionIdx = 0
fileIdx++

}

load()

}



async function load(){

block.innerHTML="Cargando..."

let r = await fetch(
`/session_content?file_idx=${fileIdx}&sesion_idx=${sesionIdx}`
)

let d = await r.json()

bloques = d.bloques
totalSesiones = d.total

i = 0

show(bloques[0])

}



startBtn.onclick=()=>{

startBtn.style.display="none"

fileIdx = 0
sesionIdx = 0

load()

}

nextBtn.onclick=nextBlock

restartBtn.onclick=()=>location.reload()
