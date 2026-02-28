let level = 1;
let xp = 0;
let timeLeft = 600;
let questionTime = 20;
let questionTimer;
let sessionTimer;

let voices = [];
window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
};

function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.voice = voices.find(v => v.lang.includes("es")) || voices[0];
    msg.rate = 1;
    msg.pitch = 0.8;
    window.speechSynthesis.speak(msg);
}

function startSession(){
    document.getElementById("arenaStart").style.display = "none";
    document.getElementById("gameUI").style.display = "block";

    speak("Bienvenido a la arena KaMiZen. Hoy compites contra 500 mentes.");
    startSessionTimer();
    generateChallenge();
    startFakeChat();
}

function startSessionTimer(){
    sessionTimer = setInterval(()=>{
        timeLeft--;
        let min = Math.floor(timeLeft/60);
        let sec = timeLeft%60;
        document.getElementById("timeRemaining").innerText =
            `${min}:${sec<10?'0':''}${sec}`;
        if(timeLeft <= 0){
            clearInterval(sessionTimer);
            speak("Sesión terminada. Mañana subimos nivel.");
        }
    },1000);
}

function generateChallenge(){
    clearInterval(questionTimer);

    let a = Math.floor(Math.random()*20)+1;
    let b = Math.floor(Math.random()*20)+1;

    let correct = a * b;

    document.getElementById("questionBox").innerText =
        `Nivel ${level} → ¿Cuánto es ${a} x ${b}?`;

    speak(`Nivel ${level}. Responde rápido. ¿Cuánto es ${a} por ${b}?`);

    questionTime = 20;

    questionTimer = setInterval(()=>{
        questionTime--;
        if(questionTime <= 0){
            clearInterval(questionTimer);
            xp -= 5;
            updateRanking();
            speak("Tiempo agotado. Pierdes puntos.");
            generateChallenge();
        }
    },1000);

    window.correctAnswer = correct;
}

function submitAnswer(){
    const input = document.getElementById("answerInput");
    let val = parseInt(input.value);
    input.value = "";

    if(val === window.correctAnswer){
        xp += 10;
        speak("Correcto. Sigues subiendo.");
    } else {
        xp -= 3;
        speak("Incorrecto. Otros avanzan más rápido.");
    }

    if(xp >= level * 50){
        level++;
        speak("Subes de nivel.");
        document.getElementById("ranking").classList.add("levelUp");
        setTimeout(()=> {
            document.getElementById("ranking").classList.remove("levelUp");
        },2000);
    }

    updateRanking();
    generateChallenge();
}

function updateRanking(){
    document.getElementById("ranking").innerText =
        `🏆 Nivel: ${level} | XP: ${xp}`;
}

function startFakeChat(){
    const chatBox = document.getElementById("chatBox");

    setInterval(()=>{
        let fakeXP = Math.floor(Math.random()*200);
        let msg = `Jugador_${Math.floor(Math.random()*500)} acaba de llegar a ${fakeXP} XP`;
        chatBox.innerHTML += `<div class="chatMessage">${msg}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    },3000);
}
