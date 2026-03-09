const startBtn = document.getElementById("start-btn");
const block = document.getElementById("block");

let sessionBlocks = [];
let current = 0;

function speak(text){
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
}

function nextBlock(){

    if(current < sessionBlocks.length){

        const text = sessionBlocks[current];

        block.innerText = text;

        speak(text);

        current++;

        if(current < sessionBlocks.length){
            setTimeout(nextBlock,120000); 
        }else{
            setTimeout(()=>{
                block.innerText = "Sesión finalizada.";
                speak("Sesión finalizada.");
            },3000)
        }

    }

}

startBtn.addEventListener("click", async ()=>{

    startBtn.style.display="none";

    const response = await fetch("/session_content");

    const data = await response.json();

    sessionBlocks = data.bloques;

    nextBlock();

});
