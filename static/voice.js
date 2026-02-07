// voice.js
function speak(text, lang="es") {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang === "es" ? "es-ES" : "en-US";
    msg.voice = speechSynthesis.getVoices().find(v => v.lang.includes(msg.lang));
    speechSynthesis.speak(msg);
}

function speakStory(story, lang="es") {
    story.forEach(line => {
        setTimeout(()=>speak(line, lang), 0);
    });
}
