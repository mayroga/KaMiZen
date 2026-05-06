/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V4 (STRICT LINEAR)
   - Mandatory English Only
   - Flow: Name -> Stories (Ascending) -> Missions (Ascending)
   - Breathing circle synchronization (Inhale = Expand / Exhale = Contract)
   ============================================================= */

let state = {
    name: "",
    step: "welcome", // welcome, stories, missions, complete
    sIndex: 0,       // Story counter
    mIndex: 0,       // Mission counter
    bIndex: 0,       // Block counter within mission
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
        
        // Ensure strictly ascending order by ID
        state.stories = (sData.stories || []).sort((a, b) => a.id - b.id);
        state.missions = (mData.missions || []).sort((a, b) => a.id - b.id);
        state.initialized = true;
    } catch (err) {
        console.error("System initializing error...");
    }
}

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US"; // Strict English
    window.speechSynthesis.speak(msg);
}

function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    // 1. MANDATORY GREETING & NAME
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <p>Welcome. Please enter your name to begin the protocol.</p>
                <input id="nameInput" type="text" placeholder="Full Name" autocomplete="off" />
            </div>
            <button class="primary" onclick="startApp()">CONTINUE</button>
        `;
        return;
    }

    // 2. STORIES PHASE (LOWER TO HIGHER ID)
    if (state.step === "stories") {
        const s = state.stories[state.sIndex];
        if (!s) {
            state.step = "missions";
            render();
            return;
        }
        app.innerHTML = `
            <h3 style="color:#3b82f6;">KNOWLEDGE BASE: PART ${s.id}</h3>
            <div class="card">
                <p style="font-size:1.4em; line-height:1.6;">${s.en}</p>
            </div>
            <button class="primary" onclick="nextStory()">CONTINUE</button>
        `;
        speak(s.en);
        return;
    }

    // 3. MISSIONS PHASE (1 TO 35, BLOCK BY BLOCK)
    if (state.step === "missions") {
        const mission = state.missions[state.mIndex];
        if (!mission) {
            state.mIndex = 0; // Restart loop if finished
            state.step = "stories"; // Or complete
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

    // Mapping JSON block types to UI
    const type = block.t || (block.story ? "story" : "");

    switch (type) {
        case "v": // Title
            content = `<h2 class="title-block">${block.tx.en}</h2>`;
            speak(block.tx.en);
            break;
        case "h": // Hint
            content = `<div class="card hint"><h3>Guidance:</h3><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;
        case "story": // Internal Mission Story
            content = `<div class="card story"><h3>Philosophy</h3><p>${block.story.en}</p></div>`;
            speak(block.story.en);
            break;
        case "br": // Manual Breath
            content = `
                <div class="circle-container">
                    <div class="circle breath-manual"><span>${block.tx.en}</span></div>
                </div>`;
            speak(block.tx.en);
            break;
        case "d": // Decision
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
        case "sil": // Silence Focus
            content = `<div class="card"><h3>${block.tx.en}</h3><p>${block.inf.en}</p></div>`;
            break;
        case "breath_auto": // Automatic Respiratory Circle
            content = `
                <div class="circle-container">
                    <div id="respiratoryCircle" class="circle blue-breath"><span id="breathAction">...</span></div>
                </div>
                <div class="card"><p>${block.inf.en}</p></div>`;
            app.innerHTML = content;
            return startAutoBreath(block.d);
        case "r": // Points
            content = `<div class="reward">⭐ ${block.tx} +${block.p} pts</div>`;
            break;
        case "c": // Conclusion
            content = `<div class="card conclusion"><p>${block.tx.en}</p></div>`;
            speak(block.tx.en);
            break;
    }

    app.innerHTML = content + `<button class="primary" onclick="nextBlock()">CONTINUE</button>`;
}

/* --- CONTROL LOGIC --- */

function startApp() {
    const val = document.getElementById("nameInput").value;
    if (!val) return alert("Name required");
    state.name = val;
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
        <div class="exp-box ${isCorrect ? 'ok' : 'no'}">
            <p><strong>${isCorrect ? 'CORRECT' : 'REVISE'}</strong></p>
            <span>${explanation}</span>
        </div>
        <button class="primary" onclick="nextBlock()">CONTINUE</button>
    `;
    speak(explanation);
}

function startAutoBreath(seconds) {
    let timeLeft = seconds;
    let phase = true; // true = Inhale (Expand), false = Exhale (Contract)
    const label = document.getElementById("breathAction");
    const circle = document.getElementById("respiratoryCircle");
    
    const interval = setInterval(() => {
        if (!label || !circle) { clearInterval(interval); return; }
        
        if (phase) {
            label.innerText = "INHALE";
            circle.style.transform = "scale(1.2)"; // Visual expansion
            speak("Inhale");
        } else {
            label.innerText = "EXHALE";
            circle.style.transform = "scale(0.8)"; // Visual contraction
            speak("Exhale");
        }
        
        phase = !phase;
        timeLeft -= 4;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">MISSION COMPLETE</button>`;
        }
    }, 4000);
}
