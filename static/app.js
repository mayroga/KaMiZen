// Animaciones de feedback
function highlightFeedback(){
    const fb = document.getElementById("feedback");
    fb.style.color="#ffcc00";
    setTimeout(()=>{fb.style.color="#00ffcc";},500);
}

// Simulación de bots extra
function autoBotChat(){
    const msgs = [
        "🔥 Avanza hacia el éxito",
        "💡 Recuerda: cada decisión importa",
        "🏆 Tu nivel sube con cada elección",
        "🌱 Bienestar y mente clara"
    ];
    setInterval(()=>{
        const chatBox = document.getElementById("chatBox");
        if(chatBox){
            chatBox.innerHTML += `<div><strong>AURA_BOT:</strong> ${msgs[Math.floor(Math.random()*msgs.length)]}</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    },15000);
}

document.addEventListener("DOMContentLoaded",()=>{
    autoBotChat();
});
