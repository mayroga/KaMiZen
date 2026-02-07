// content.js
let phrases = [
    "Cada día es un nuevo amanecer.",
    "El valor está en seguir aunque tengas miedo.",
    "El éxito llega a los que perseveran."
];

let stories = [
    ["Un joven soñaba con riqueza y felicidad...", "Con cada esfuerzo, su mundo se iluminaba..."],
    ["Había una mujer que nunca se rendía...", "Cada decisión la acercaba a su bienestar."]
];

let riddles = [
    {q:"¿Qué sube y nunca baja?", a:"edad"},
    {q:"Tengo ciudades, pero no casas; tengo ríos, pero no agua...", a:"mapa"}
];

function getRandomPhrase() {
    return phrases[Math.floor(Math.random()*phrases.length)];
}

function getRandomStory() {
    return stories[Math.floor(Math.random()*stories.length)];
}

function getRandomRiddle() {
    return riddles[Math.floor(Math.random()*riddles.length)];
}
