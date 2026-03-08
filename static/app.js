function highlightFeedback(){
    const fb=document.getElementById("feedback");
    if(!fb)return;
    fb.style.color="#ffcc00";
    setTimeout(()=>{fb.style.color="#00ffcc";},500);
}

function autoBotChat(){
    const msgs=[
        "🔥 Avanza hacia el éxito",
        "💡 Cada decisión importa",
        "🏆 Tu nivel sube",
        "🌱 Bienestar activo"
    ];

    setInterval(()=>{
        const chatBox=document.getElementById("chatBox");
        if(chatBox){
            chatBox.innerHTML+=`<div><strong>AURA_BOT:</strong> ${msgs[Math.floor(Math.random()*msgs.length)]}</div>`;
            chatBox.scrollTop=chatBox.scrollHeight;
        }
    },20000);
}

document.addEventListener("DOMContentLoaded",()=>{
    autoBotChat();
});
