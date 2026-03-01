// =============================
// KaMiZen App JS – Gamificación
// =============================
function highlightFeedback() {
    const fb = document.getElementById("feedback");
    fb.style.color="#ffcc00";
    setTimeout(()=>{fb.style.color="#00ffcc";},500);
}

function animateProgress(level){
    const bar = document.getElementById("progressFill");
    if(bar){
        bar.style.width = `${Math.min(level*10,100)}%`;
    }
}

// Simulación de bots adicional
function autoBotChat(){
    const msgs = [
        "🔥 ¡Cerré un trato millonario!",
        "⚡ Cada segundo cuenta",
        "🏆 Subí un nivel gracias a mi disciplina",
        "💥 ¡Dopamina activada!"
    ];
    setInterval(()=>{
        if(document.getElementById("chatBox")){
            const chatBox = document.getElementById("chatBox");
            chatBox.innerHTML += `<div><strong>AURA_BOT:</strong> ${msgs[Math.floor(Math.random()*msgs.length)]}</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    },12000);
}

// Inicializar
document.addEventListener("DOMContentLoaded",()=>{
    autoBotChat();
});
