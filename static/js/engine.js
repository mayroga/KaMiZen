/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V8 (PROFESSIONAL PROTOCOL)
   - Mandatory English Only.
   - Unified Respiratory Cycle: Inhale (Expand) + Exhale (Contract).
   - Real-time Countdown Timers for Breathing and Silence.
   - Integrated Decision-Action Logic.
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
        console.error("Connection Lost: Knowledge Base Offline.");
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
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <p>Welcome. Enter your name to initiate the protocol.</p>
                <input id="nameInput" type="text" placeholder="Full Name" autocomplete="off" />
            </div>
            <button class="primary" onclick="startApp()">START PROTOCOL</button>
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
                <h3 class="indicator">KNOWLEDGE PHASE ${currentStory.id}</h3>
                <div class="card story-box">
                    <p>${currentStory.en}</p>
                </div>
                <button class="primary" onclick="startMission()">BEGIN MISSION</button>
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
        case "d": // Decision & Answer Linked
            content = `
                <div class="card">
                    <p class="question">${block.q.en}</p>
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
        case "sil":
            content = `
                <div class="card silence">
                    <h3>SILENCE PHASE</h3>
                    <p>${block.tx.en}</p>
                    <div class="timer-display">TIME REMAINING: <span id="silTimer">${block.d}</span>s</div>
                    <p class="sub-info">${block.inf.en}</p>
                </div>`;
            app.innerHTML = content;
            return startCountdown("silTimer", block.d);
        case "breath_auto": 
            content = `
                <div class="circle-container">
                    <div id="respiratoryCircle" class="circle blue-breath" style="transition: transform 4s ease-in-out;">
                        <span id="breathAction">READY</span>
                    </div>
                </div>
                <div class="card info">
                    <div class="timer-display">CYCLE TIME: <span id="breathTimer">${block.d}</span>s</div>
                    <p>${block.inf.en}</p>
                </div>`;
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

    app.innerHTML = content + `<button class="primary" id="btnNext" onclick="nextBlock()">CONTINUE</button>`;
}

/* --- LOGIC CONTROLS --- */

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
    
    fb.innerHTML = `
        <div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}">
            <p><strong>${isCorrect ? 'CORRECT' : 'REVISE'}</strong></p>
            <span>${exp}</span>
        </div>
        <button class="primary" onclick="nextBlock()">CONTINUE</button>
    `;
    speak(exp);
}

function startCountdown(elementId, seconds) {
    let timeLeft = seconds;
    const timer = setInterval(() => {
        timeLeft--;
        const el = document.getElementById(elementId);
        if (el) el.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">PROCEED</button>`;
        }
    }, 1000);
}

function startAutoBreath(seconds) {
    let timeLeft = seconds;
    let isInhaling = true;
    const label = document.getElementById("breathAction");
    const circle = document.getElementById("respiratoryCircle");
    const timerDisplay = document.getElementById("breathTimer");

    const breathInterval = setInterval(() => {
        if (isInhaling) {
            label.innerText = "INHALE";
            circle.style.transform = "scale(1.5)"; 
            speak("Inhale");
        } else {
            label.innerText = "EXHALE";
            circle.style.transform = "scale(0.8)"; 
            speak("Exhale");
        }
        isInhaling = !isInhaling;
    }, 4000);

    const clockInterval = setInterval(() => {
        timeLeft--;
        if (timerDisplay) timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(breathInterval);
            clearInterval(clockInterval);
            circle.style.transform = "scale(1)";
            label.innerText = "DONE";
            const btn = document.createElement("button");
            btn.className = "primary";
            btn.innerText = "MISSION SUCCESS";
            btn.onclick = nextBlock;
            document.getElementById("app").appendChild(btn);
        }
    }, 1000);
}
