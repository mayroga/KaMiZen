const startBtn = document.getElementById("start-btn");
const block = document.getElementById("block");

let sessionBlocks = [];
let current = 0;

let timer = null;
let timeLeft = 120;

// crear botón siguiente dinámicamente
const nextBtn = document.createElement("button");
nextBtn.innerText = "Siguiente";
nextBtn.style.marginTop = "20px";
nextBtn.style.display = "none";

document.getElementById("content-box").appendChild(nextBtn);


// función voz
function speak(text){
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
}


// temporizador
function startTimer(){

    clearInterval(timer);
    timeLeft = 120;

    timer = setInterval(()=>{

        block.innerText = sessionBlocks[current-1] + "\n\nTiempo restante: " + timeLeft + "s";

        timeLeft--;

        if(timeLeft < 0){

            clearInterval(timer);

        }

    },1000)

}


// mostrar bloque
function nextBlock(){

    clearInterval(timer);

    if(current < sessionBlocks.length){

        const text = sessionBlocks[current];

        block.innerText = text;

        speak(text);

        current++;

        startTimer();

        if(current < sessionBlocks.length){

            setTimeout(nextBlock,120000);

        }else{

            setTimeout(()=>{

                block.innerText = "Sesión finalizada.";
                speak("Sesión finalizada");

                nextBtn.style.display = "none";

            },3000)

        }

    }

}


// botón siguiente
nextBtn.addEventListener("click", ()=>{

    nextBlock();

});


// iniciar sesión
startBtn.addEventListener("click", async ()=>{

    startBtn.style.display = "none";

    nextBtn.style.display = "inline-block";

    const response = await fetch("/session_content");

    const data = await response.json();

    sessionBlocks = data.bloques;

    nextBlock();

});
