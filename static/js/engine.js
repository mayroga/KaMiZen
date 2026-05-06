/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V5 (PERFECT LINEAR FLOW)
   - Mandatory English Protocol
   - Sequence: Welcome -> Stories (Ascending) -> Missions (Ascending)
   - Synchronized Respiratory Circle (Inhale/Exhale)
   ============================================================= */

let state = {
    name: "",
    step: "welcome", 
    sIndex: 0,       
    mIndex: 0,       
    bIndex: 0,       
    stories: [],
    missions: [],
    initialized: false
};

// INITIALIZATION
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
        
        // Sorting by ID to ensure strict progression (1, 2, 3...)
        state.stories = (sData.stories || []).sort((a, b) => a.id - b.id);
        state.missions = (mData.missions || []).sort((a, b) => a.id - b.id);
        state.initialized = true;
    } catch (err) {
        console.error("Critical: Database connection failed.");
    }
}

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    window.speechSynthesis.speak(msg);
}

// MAIN RENDER ENGINE
function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    // PHASE 1: GREETING & NAME (MANDATORY)
    if (state.step === "welcome") {
        app.innerHTML = `
            <div class="welcome-screen">
                <h1>KAMIZEN LIFE SAFETY</h1>
                <div class="card">
                    <p>Enter your name to initiate the protocol:</p>
                    <input id="nameInput" type="text" placeholder="Full Name" autocomplete="off" />
                </div>
                <button class="primary" onclick="startApp()">CONTINUE</button>
            </div>
        `;
        return;
    }

    // PHASE 2: KNOWLEDGE STORIES (ASCENDING)
    if (state.step === "stories") {
        const s = state.stories[state.sIndex];
        if (!s) {
            state.step = "missions";
            render();
            return;
        }
        app.innerHTML = `
            <h3 class="section-title">KNOWLEDGE PROTOCOL: ${s.id}</h3>
            <div class="card story-card">
                <p>${s.en}</p>
            </div>
            <button class="primary" onclick="nextStory()">CONTINUE</button>
        `;
        speak(s.en);
        return;
    }

    // PHASE 3: MISSIONS (ASCENDING BLOCK BY BLOCK)
    if (state.step === "missions") {
        const mission = state.missions[state.mIndex];
        if (!mission) {
            // End of all levels -> Restart or Completion screen
            state.mIndex = 0; 
            state.step = "stories";
            render();
            return;
        }

        const block = mission.b[state.bIndex];
        renderMissionBlock(block, mission.b.length);
    }
}

function renderMissionBlock(block, totalBlocks) {
    const app = document.getElementById("app");
    let content = "";
    const type = block.t || (block.story ? "story" : "");

    switch (type) {
        case "v": // Title
            content = `<h2 class="mission-title">${block.tx.en}</h2>`;
            speak(block.tx.en);
            break;
        case "h": // Hint
            content = `<div class="card hint-card"><h3>GUIDANCE:</h3><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;
        case "story": // Philo
            content = `<div class="card philosophy-card"><h3>PHILOSOPHY</h3><p>${block.story.en}</p></div>`;
            speak(block.story.en);
            break;
        case "br": // Manual pause
            content = `<div class="circle-container"><div class="circle breath-static"><span>${block.tx.en}</span></div></div>`;
            speak(block.tx.en);
            break;
        case "d": // Decision / Quiz
            content = `
                <div class="card quiz-card">
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
        case "sil": // Focus
            content = `<div class="card silence-card"><h3>${block.tx.en}</h3><p>${block.inf.en}</p></div>`;
            break;
        case "breath_auto": // THE CIRCLE (MANDATORY SYNC)
            content = `
                <div class="circle-container">
                    <div id="respiratoryCircle" class="circle breathing-circle-active"><span id="breathAction">...</span></div>
                </div>
                <div class="card info-card"><p>${block.inf.en}</p></div>`;
            app.innerHTML = content;
            return startAutoBreath(block.d);
        case "r": // Rewards
            content = `<div class="reward-tag">⭐ ${block.tx} +${block.p} points</div>`;
            break;
        case "c": // Conclusion
            content = `<div class="card final-card"><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;
    }

    app.innerHTML = content + `<button class="primary" onclick="nextBlock()">CONTINUE</button>`;
}

/* --- LOGIC CONTROLLERS --- */

function startApp() {
    const name = document.getElementById("nameInput").value;
    if (!name.trim()) return; 
    state.name = name;
    state.step = "stories";
    render();
}

function nextStory() {
    state.sIndex++;
    render();
}

function nextBlock() {
    const mission = state.missions[state.mIndex];
    if (state.bIndex < mission.b.length - 1) {
        state.bIndex++;
    } else {
        state.mIndex++;
        state.bIndex = 0;
    }
    render();
}

function handleDecision(idx, correct, explanations) {
    const isCorrect = idx === correct;
    const fb = document.getElementById("feedback");
    const explanation = explanations[idx];
    
    fb.innerHTML = `
        <div class="explanation-box ${isCorrect ? 'success' : 'alert'}">
            <p><strong>${isCorrect ? 'CORRECT' : 'REVISE'}</strong></p>
            <span>${explanation}</span>
        </div>
        <button class="primary" onclick="nextBlock()">CONTINUE</button>
    `;
    speak(explanation);
}

function startAutoBreath(seconds) {
    let timeLeft = seconds;
    let isInhaling = true; 
    const label = document.getElementById("breathAction");
    const circle = document.getElementById("respiratoryCircle");
    
    const interval = setInterval(() => {
        if (!label || !circle) { clearInterval(interval); return; }
        
        if (isInhaling) {
            label.innerText = "INHALE";
            circle.classList.add("expand");
            circle.classList.remove("contract");
            speak("Inhale");
        } else {
            label.innerText = "EXHALE";
            circle.classList.add("contract");
            circle.classList.remove("expand");
            speak("Exhale");
        }
        
        isInhaling = !isInhaling;
        timeLeft -= 4; // 4 second cycles
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">COMPLETE PHASE</button>`;
        }
    }, 4000);
}
