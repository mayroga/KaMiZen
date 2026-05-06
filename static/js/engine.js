// =========================
// KAMIZEN ENGINE V2
// FULL UI + FLOW SYSTEM
// =========================

let stories = [];
let missions = [];
let storyIndex = 0;
let missionIndex = 0;

const app = document.getElementById("app");

// =========================
// 🔊 TTS ENGINE
// =========================
function speak(text) {
    if (!text) return;

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    msg.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
}

// =========================
// 🎨 UI HELPERS
// =========================
function clear() {
    app.innerHTML = "";
}

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.innerText = text;
    return e;
}

// =========================
// 🌬️ BREATHING CIRCLE
// =========================
function breathingCircle(duration) {
    const circle = el("div", "circle", "INHALE");
    app.appendChild(circle);

    let inhale = true;

    const interval = setInterval(() => {
        if (inhale) {
            circle.innerText = "INHALE";
            circle.style.transform = "scale(1.4)";
        } else {
            circle.innerText = "EXHALE";
            circle.style.transform = "scale(0.8)";
        }
        inhale = !inhale;
    }, duration * 500);

    setTimeout(() => {
        clearInterval(interval);
        circle.innerText = "DONE";
        circle.style.transform = "scale(1)";
    }, duration * 1000);
}

// =========================
// 🤫 SILENCE MODE
// =========================
function silenceBlock(duration) {
    const box = el("div", "silence", "SILENCE...");
    app.appendChild(box);

    setTimeout(() => {
        box.innerText = "DONE";
    }, duration * 1000);
}

// =========================
// ❓ QUESTION RENDER
// =========================
function renderQuestion(block, next) {
    const container = el("div", "question");

    const title = el("h2", "", block.q.en);
    container.appendChild(title);

    const btns = [];

    block.op.forEach((opt, i) => {
        const b = el("button", "btn", opt);

        b.onclick = () => {
            btns.forEach(x => x.disabled = true);

            const isCorrect = i === block.c;

            if (isCorrect) {
                b.classList.add("correct");
                speak("Correct");
            } else {
                b.classList.add("wrong");
                speak("Incorrect");
            }

            const exp = el("p", "explanation", block.ex[i] || "");
            container.appendChild(exp);

            const nextBtn = el("button", "next", "CONTINUE");
            nextBtn.onclick = next;
            container.appendChild(nextBtn);
        };

        btns.push(b);
        container.appendChild(b);
    });

    app.appendChild(container);
}

// =========================
// 🎯 BLOCK RENDERER
// =========================
function renderBlock(block, next) {
    clear();

    switch (block.t) {

        case "v":
            speak(block.tx.en);
            app.appendChild(el("h1", "title", block.tx.en));
            setTimeout(next, 2000);
            break;

        case "h":
            app.appendChild(el("h2", "header", block.tx.en));
            setTimeout(next, 1500);
            break;

        case "story":
            app.appendChild(el("p", "story", block.story.en));
            speak(block.story.en);
            setTimeout(next, 3000);
            break;

        case "d":
            renderQuestion(block, next);
            break;

        case "breath_auto":
            app.appendChild(el("h3", "", block.tx.en));
            breathingCircle(block.d);
            speak(block.tx.en);
            setTimeout(next, block.d * 1000);
            break;

        case "sil":
            silenceBlock(block.d);
            setTimeout(next, block.d * 1000);
            break;

        case "r":
            app.appendChild(el("div", "reward", block.tx));
            setTimeout(next, 1000);
            break;

        case "c":
            app.appendChild(el("p", "comment", block.tx.en));
            setTimeout(next, 1000);
            break;

        default:
            next();
    }
}

// =========================
// 📖 STORY ENGINE
// =========================
function runStory() {
    if (storyIndex >= stories.length) {
        runMission();
        return;
    }

    const story = stories[storyIndex];
    storyIndex++;

    clear();
    app.appendChild(el("h1", "title", story.title || "Story"));

    speak(story.title || "");

    setTimeout(runStory, 3000);
}

// =========================
// 🎯 MISSION ENGINE
// =========================
function runMission() {
    if (missionIndex >= missions.length) {
        clear();
        app.appendChild(el("h1", "", "SYSTEM COMPLETE"));
        speak("System complete");
        return;
    }

    const mission = missions[missionIndex];
    missionIndex++;

    let i = 0;

    function next() {
        if (i < mission.b.length) {
            renderBlock(mission.b[i], () => {
                i++;
                next();
            });
        } else {
            setTimeout(runMission, 1500);
        }
    }

    next();
}

// =========================
// 🚀 INIT
// =========================
async function init() {
    const s = await fetch("/api/stories").then(r => r.json());
    const m = await fetch("/api/missions").then(r => r.json());

    stories = s.stories || [];
    missions = m.missions || [];

    runStory();
}

init();
