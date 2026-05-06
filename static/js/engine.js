/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V6 (STRICT 1-TO-1 RATIO)
   Flow: Story(N) -> Mission(N) Blocks -> Auto-Next Story(N+1)
   Language: English Only (Mandatory)
   Breathing: Physical Expansion/Contraction Synchronization
   ============================================================= */

let state = {
    name: "",
    step: "welcome", // welcome, training
    index: 0,        // Unified index for Story(N) and Mission(N)
    bIndex: 0,       // Block index within current mission
    subStep: "story", // story, blocks
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
        console.error("Critical Failure: Knowledge Base Offline.");
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

    // 1. MANDATORY NAME ENTRY
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <p>Welcome. Please enter your name to begin.</p>
                <input id="nameInput" type="text" placeholder="Full Name" />
            </div>
            <button class="primary" onclick="startApp()">CONTINUE</button>
        `;
        return;
    }

    // 2. TRAINING PHASE (STORY N -> MISSION N)
    if (state.step === "training") {
        const currentStory = state.stories[state.index];
        const currentMission = state.missions[state.index];

        if (!currentStory && !currentMission) {
            app.innerHTML = "<h1>PROTOCOL COMPLETE</h1><button class='primary' onclick='location.reload()'>RESTART</button>";
            return;
        }

        // PART A: SHOW STORY FIRST
        if (state.subStep === "story") {
            app.innerHTML = `
                <h3 class="step-indicator">STEP ${currentStory.id}: KNOWLEDGE</h3>
                <div class="card story-box">
                    <p>${currentStory.en}</p>
                </div>
                <button class="primary" onclick="startMission()">PROCEED TO MISSION</button>
            `;
            speak(currentStory.en);
            return;
        }

        // PART B: SHOW MISSION BLOCKS ONE BY ONE
        if (state.subStep === "blocks") {
            const block = currentMission.b[state.bIndex];
            renderBlock(block, currentMission.b.length);
        }
    }
}

function renderBlock(block, totalBlocks) {
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
        case "br":
            content = `<div class="circle-container"><div class="circle manual-b"><span>${block.tx.en}</span></div></div>`;
            speak(block.tx.en);
            break;
        case "d":
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
            content = `<div class="card silence"><h3>${block.tx.en}</h3><p>${block.inf.en}</p></div>`;
            break;
        case "breath_auto":
            content = `
                <div class="circle-container">
                    <div id="respiratoryCircle" class="circle blue-breath"><span id="breathAction">...</span></div>
                </div>
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

/* --- LOGIC CONTROLS --- */

function startApp() {
    const val = document.getElementById("nameInput").value;
    if (!val) return;
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
        // Mission finished, move to next Story
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
            <p><strong>${isCorrect ? 'CORRECT' : 'WARNING'}</strong></p>
            <span>${exp}</span>
        </div>
        <button class="primary" onclick="nextBlock()">CONTINUE</button>
    `;
    speak(exp);
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
            circle.style.transform = "scale(1.3)"; // Physically expands
            circle.style.transition = "transform 4s ease-in-out";
            speak("Inhale");
        } else {
            label.innerText = "EXHALE";
            circle.style.transform = "scale(0.7)"; // Physically contracts
            circle.style.transition = "transform 4s ease-in-out";
            speak("Exhale");
        }

        isInhaling = !isInhaling;
        timeLeft -= 4;

        if (timeLeft <= 0) {
            clearInterval(interval);
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">MISSION SUCCESS</button>`;
        }
    }, 4000);
}
