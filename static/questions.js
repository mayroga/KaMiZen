// questions.js
let questions = [
    "¿Cómo te sientes hoy?",
    "¿Qué te gustaría lograr ahora?",
    "¿Has descansado lo suficiente?"
];

function askQuestion() {
    const q = questions[Math.floor(Math.random()*questions.length)];
    return q;
}
