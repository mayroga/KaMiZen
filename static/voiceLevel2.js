function speakLevel2(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang==="es"?"es-ES":"en-US";
    msg.voice = speechSynthesis.getVoices().find(v=>v.lang.includes(msg.lang));
    speechSynthesis.speak(msg);
}
