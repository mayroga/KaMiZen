document.getElementById("btnRespirar").onclick = () => {
    avatarReactLevel2('respirar');
    speakLevel2(lang==="es"?"Respiras profundamente.":"Take a deep breath.");
};

document.getElementById("btnEstirarse").onclick = () => {
    avatarReactLevel2('estirarse');
    speakLevel2(lang==="es"?"Te estiras y te relajas.":"Stretch and relax.");
};

document.getElementById("btnCerrarOjos").onclick = () => {
    avatarReactLevel2('cerrarOjos');
    speakLevel2(lang==="es"?"Cierras los ojos y sientes paz.":"Close your eyes and feel calm.");
};
