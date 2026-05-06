/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V8 (UNIFIED LOGIC)
   - Mandatory English Only
   - Integrated Timers for Silence and Breath
   - Unified Question/Answer/Explanation flow
   - Automated Physical Respiratory Cycle (Inhale/Exhale)
   ============================================================= */

let state = {
    name: "",
    step: "welcome", 
    index: 0,        
    bIndex: 0,       
    subStep: "story", 
    stories: [],
    missions: [],
    initialized: false
};

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    try {
        const [sRes, mRes] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        const sData = await sRes.json();
        const mData = await mRes.json();
        
        state.stories = (sData.stories || []).sort((a, b) => a.id - b.id);
        state.missions = (mData.missions || []).sort((a, b) => a.id - b.id);
        state.initialized = true;
    } catch (err) {
        console.error("Knowledge Base Offline.");
    }
}

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    window.speechSynthesis.speak(msg);
}

function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>AL CIELO - KAMIZEN</h1>
            <div class="card">
                <p>Welcome. Enter your name to start the protocol.</p>
                <input id="nameInput" type="text" placeholder="Full Name" />
            </div>
            <button class="primary" onclick="startApp()">START</button>
        `;
        return;
    }

    if (state.step === "training") {
        const currentStory = state.stories[state.index];
        const currentMission = state.missions[state.index];

        if (!currentStory || !currentMission) {
            app.innerHTML = "<h1>PROTOCOL COMPLETE</h1><button class='primary' onclick='location.reload()'>RESTART</button>";
            return;
        }

        if (state.subStep === "story") {
            app.innerHTML = `
                <h3 class="indicator">STORY PHASE ${currentStory.id}</h3>
                <div class="card story-box">
                    <p>${currentStory.en}</p>
                </div>
                <button class="primary" onclick="startMission()">GO TO MISSION</button>
            `;
            speak(currentStory.en);
            return;
        }

        if (state.subStep === "blocks") {
            const block = currentMission.b[state.bIndex];
            renderBlock(block);
        }
    }
}

function renderBlock(block) {
    const app = document.getElementById("app");
    let content = "";
    const type = block.t || (block.story ? "story" : "");

    switch (type) {
        case "v":
            content = `<h2 class="m-title">${block.tx.en}</h2>`;
            speak(block.tx.en);
            break;
        case "h":
            content = `<div class="card hint"><h3>GUIDE:</h3><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;
        case "story":
            content = `<div class="card philo"><h3>PHILOSOPHY</h3><p>${block.story.en}</p></div>`;
            speak(block.story.en);
            break;
        case "d": // Unified Question/Answer Logic
            content = `
                <div class="card">
                    <p class="question"><strong>QUESTION:</strong> ${block.q.en}</p>
                    <div id="answers">
                        ${block.op.map((opt, i) => `
                            <div class="answer" onclick="handleDecision(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">
                                ${opt}
                            </div>
                        `).join("")}
                    </div>
                    <div id="feedback"></div>
                </div>`;
            speak(block.q.en);
            return app.innerHTML = content;
        case "sil": // Silence with Timer
            content = `
                <div class="card silence">
                    <h3>${block.tx.en}</h3>
                    <div class="timer" id="timerDisplay">${block.d}s</div>
                    <p>${block.inf.en}</p>
                </div>`;
            app.innerHTML = content;
            return startCountdown(block.d);
        case "breath_auto": // Integrated Respiratory Cycle
            content = `
                <div class="circle-container">
                    <div id="respiratoryCircle" class="circle blue-breath" style="transition: transform 4s ease-in-out;">
                        <span id="breathAction">READY</span>
                    </div>
                </div>
                <div class="timer-box">Time Remaining: <span id="timerDisplay">${block.d}</span>s</div>
                <div class="card info"><p>${block.inf.en}</p></div>`;
            app.innerHTML = content;
            return startAutoBreath(block.d);
        case "r":
            content = `<div class="reward">⭐ ${block.tx} +${block.p} PTS</div>`;
            break;
        case "c":
            content = `<div class="card conclusion"><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;
    }

    app.innerHTML = content + `<button class="primary" onclick="nextBlock()">CONTINUE</button>`;
}

/* --- LOGIC & TIMERS --- */

function startApp() {
    const val = document.getElementById("nameInput").value;
    if (!val.trim()) return;
    state.name = val;
    state.step = "training";
    state.subStep = "story";
    render();
}

function startMission() {
    state.subStep = "blocks";
    state.bIndex = 0;
    render();
}

function nextBlock() {
    const currentMission = state.missions[state.index];
    if (state.bIndex < currentMission.b.length - 1) {
        state.bIndex++;
        render();
    } else {
        state.index++;
        state.subStep = "story";
        state.bIndex = 0;
        render();
    }
}

function handleDecision(idx, correct, explanations) {
    const isCorrect = idx === correct;
    const fb = document.getElementById("feedback");
    const exp = explanations[idx];
    
    // Everything remains on one screen (Question + Selection + Explanation)
    fb.innerHTML = `
        <div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}">
            <p><strong>${isCorrect ? 'SUCCESS' : 'ATTENTION'}</strong></p>
            <span>${exp}</span>
        </div>
        <button class="primary" onclick="nextBlock()">PROCEED</button>
    `;
    speak(exp);
}

function startCountdown(seconds) {
    let timeLeft = seconds;
    const display = document.getElementById("timerDisplay");
    const interval = setInterval(() => {
        timeLeft--;
        if (display) display.innerText = timeLeft + "s";
        if (timeLeft <= 0) {
            clearInterval(interval);
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">CONTINUE</button>`;
        }
    }, 1000);
}

function startAutoBreath(seconds) {
    let timeLeft = seconds;
    let isInhaling = true;
    const label = document.getElementById("breathAction");
    const circle = document.getElementById("respiratoryCircle");
    const timerDisplay = document.getElementById("timerDisplay");

    const runCycle = () => {
        if (!label || !circle) return;
        if (isInhaling) {
            label.innerText = "INHALE";
            circle.style.transform = "scale(1.5)";
            speak("Inhale");
        } else {
            label.innerText = "EXHALE";
            circle.style.transform = "scale(0.7)";
            speak("Exhale");
        }
        isInhaling = !isInhaling;
    };

    runCycle(); // Initial trigger
    const cycleInterval = setInterval(runCycle, 4000);

    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timerDisplay) timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(cycleInterval);
            clearInterval(timerInterval);
            circle.style.transform = "scale(1.0)";
            label.innerText = "COMPLETE";
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">MISSION SUCCESS</button>`;
        }
    }, 1000);
}
