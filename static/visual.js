// visual.js
let currentMood = "neutral";

function triggerEffect(effect) {
    switch(effect) {
        case "calma":
            document.body.style.background = "#88ccff";
            break;
        case "energia":
            document.body.style.background = "#ffcc88";
            break;
        case "relax":
            document.body.style.background = "#ccffaa";
            break;
    }
}

function updateMood(mood) {
    currentMood = mood;
    triggerEffect(mood);
}
