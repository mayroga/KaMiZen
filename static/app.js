// Animaciones y mensajes motivadores
function highlightFeedback(){
    const fb = document.getElementById("feedback");
    if(!fb) return;
    fb.style.color="#ffcc00";
    setTimeout(()=>{fb.style.color="#00ffcc";},500);
}

// Mensajes motivadores automáticos
function autoBotChat(){
    const msgs = [
        "🔥 Tu mente se entrena",
        "💡 Cada elección suma",
        "🏆 Siente el progreso",
        "🌱 Disfruta el bienestar",
        "⚡ Cada reto te hace más fuerte",
        "💎 Aprende algo nuevo hoy"
    ];

    setInterval(()=>{
        const chatBox = document.getElementById("chatBox");
        if(!chatBox) return;
        const msg = msgs[Math.floor(Math.random()*msgs.length)];
        chatBox.innerHTML += `<div class="simulated"><strong>AURA_BOT:</strong> ${msg}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    },15000); // cada 15 segundos
}

document.addEventListener("DOMContentLoaded",()=>{
    autoBotChat();
});
