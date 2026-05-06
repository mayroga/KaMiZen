// =====================================
// 🧠 KAMIZEN ENGINE vFINAL (NO CONFLICTS)
// =====================================

class KamiZenEngine {
    constructor(config = {}) {
        this.container = document.getElementById(config.container || "app");
        this.lang = config.lang || "en";

        this.missions = [];
        this.currentMissionIndex = 0;
        this.currentBlockIndex = 0;

        this.score = 0;
        this.isRunning = false;

        // Silence system
        this.silenceActive = false;
        this.silenceTimer = null;
        this.lastInteraction = Date.now();
        this.silenceTolerance = 1500; // ms

        // Breath system
        this.breathInterval = null;

        this.bindEvents();
    }

    // =====================================
    // LOAD DATA
    // =====================================

    load(data) {
        try {
            this.missions = data.missions || data.ses || [];
        } catch (e) {
            console.error("Load error:", e);
            this.missions = [];
        }
    }

    start() {
        if (!this.missions.length) {
            this.renderText("No missions loaded");
            return;
        }

        this.isRunning = true;
        this.currentMissionIndex = 0;
        this.runMission();
    }

    // =====================================
    // CORE FLOW
    // =====================================

    runMission() {
        this.currentBlockIndex = 0;
        this.runBlock();
    }

    runBlock() {
        if (!this.isRunning) return;

        const mission = this.missions[this.currentMissionIndex];
        if (!mission) return;

        const blocks = mission.b || [];
        const block = blocks[this.currentBlockIndex];

        if (!block) {
            this.nextMission();
            return;
        }

        this.renderBlock(block);
    }

    nextBlock() {
        this.currentBlockIndex++;
        this.runBlock();
    }

    nextMission() {
        this.currentMissionIndex++;
        if (this.currentMissionIndex >= this.missions.length) {
            this.renderText("✅ Completed");
            return;
        }
        this.runMission();
    }

    // =====================================
    // RENDER
    // =====================================

    renderBlock(block) {
        this.clear();

        const type = block.t || (block.story ? "story" : null);

        switch (type) {
            case "v":
            case "h":
            case "c":
                this.renderText(this.getText(block));
                this.autoNext(2000);
                break;

            case "story":
                this.renderText(this.getText(block));
                this.autoNext(3000);
                break;

            case "br":
                this.renderBreath(block);
                break;

            case "breath_auto":
                this.renderBreathAuto(block);
                break;

            case "d":
                this.renderDecision(block);
                break;

            case "r":
                this.applyReward(block);
                this.renderText(this.getText(block));
                this.autoNext(1500);
                break;

            case "sil":
                this.runSilence(block);
                break;

            default:
                this.renderText("...");
                this.autoNext(1000);
        }
    }

    renderText(text) {
        this.container.innerHTML = `<div class="kz-text">${text}</div>`;
    }

    clear() {
        this.stopBreath();
        this.stopSilence();
        this.container.innerHTML = "";
    }

    getText(block) {
        if (block.tx) return block.tx[this.lang] || block.tx["en"];
        if (block.story) return block.story[this.lang] || block.story["en"];
        return "";
    }

    // =====================================
    // DECISION SYSTEM
    // =====================================

    renderDecision(block) {
        const q = block.q[this.lang] || block.q["en"];

        let html = `<div class="kz-question">${q}</div>`;

        block.op.forEach((op, i) => {
            html += `<button class="kz-btn" data-i="${i}">${op}</button>`;
        });

        this.container.innerHTML = html;

        document.querySelectorAll(".kz-btn").forEach(btn => {
            btn.onclick = (e) => {
                const i = parseInt(e.target.dataset.i);
                this.handleDecision(block, i);
            };
        });
    }

    handleDecision(block, choice) {
        const correct = block.c;

        if (choice === correct) {
            this.score += 20;
        } else {
            this.score -= 5;
        }

        const explanation = block.ex?.[choice] || "";
        this.renderText(explanation);

        setTimeout(() => this.nextBlock(), 2000);
    }

    // =====================================
    // BREATH SYSTEM
    // =====================================

    renderBreath(block) {
        const text = this.getText(block);
        this.renderText(text);

        setTimeout(() => this.nextBlock(), block.d * 1000);
    }

    renderBreathAuto(block) {
        let t = 0;
        const duration = block.d * 1000;

        this.breathInterval = setInterval(() => {
            const phase = t % 8 < 4 ? "Inhale" : "Exhale";
            this.renderText(phase);
            t++;

        }, 1000);

        setTimeout(() => {
            this.stopBreath();
            this.nextBlock();
        }, duration);
    }

    stopBreath() {
        if (this.breathInterval) {
            clearInterval(this.breathInterval);
            this.breathInterval = null;
        }
    }

    // =====================================
    // SILENCE SYSTEM (NO FALSE POSITIVES BASIC)
    // =====================================

    runSilence(block) {
        this.silenceActive = true;
        const duration = block.d * 1000;

        this.renderText(this.getText(block));

        const start = Date.now();

        this.silenceTimer = setInterval(() => {
            const now = Date.now();

            if (now - this.lastInteraction < this.silenceTolerance) {
                this.renderText("⚠️ Stay still");
                this.resetSilence(block);
                return;
            }

            if (now - start >= duration) {
                this.stopSilence();
                this.nextBlock();
            }
        }, 300);
    }

    resetSilence(block) {
        this.stopSilence();
        setTimeout(() => this.runSilence(block), 500);
    }

    stopSilence() {
        this.silenceActive = false;
        if (this.silenceTimer) {
            clearInterval(this.silenceTimer);
            this.silenceTimer = null;
        }
    }

    bindEvents() {
        ["mousemove", "keydown", "click", "touchstart"].forEach(evt => {
            document.addEventListener(evt, () => {
                this.lastInteraction = Date.now();
            });
        });
    }

    // =====================================
    // REWARD
    // =====================================

    applyReward(block) {
        this.score += block.p || 0;
    }

    // =====================================
    // UTILS
    // =====================================

    autoNext(ms) {
        setTimeout(() => this.nextBlock(), ms);
    }
}

// =====================================
// INIT
// =====================================

window.KamiZenEngine = KamiZenEngine;
