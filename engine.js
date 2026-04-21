/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO FINAL STABLE v2
 * SINGLE LOOP ENGINE (NO FREEZE, NO DUPLICATES, PHASE SYSTEM READY)
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE CORE (GAME LOOP CONTROL)
    // ==========================================
    const state = {
        score: 0,
        lang: "en",
        missionId: 1,
        mission: null,

        phase: 1, // 1 = FLOAT GAME, 2 = LEARNING, 3 = DYNAMIC GAME
        phaseTimer: 300,

        silenceMinutes: 3,
        silenceActive: false,

        locked: false,
        wordInterval: null,
        timerInterval: null,

        history: [],
        maxHistory: 3
    };

    // ==========================================
    // 🔊 AUDIO SYSTEM (WIN / FAIL / BACKGROUND)
    // ==========================================
    const Audio = {
        bg: null,
        win: null,
        fail: null,

        init() {
            this.bg = document.getElementById("bg");
            this.win = document.getElementById("ok");
            this.fail = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.35;
                this.bg.playbackRate = 1.1;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (type === "win" && this.win) this.win.play();
            if (type === "fail" && this.fail) this.fail.play();
        }
    };

    // ==========================================
    // 🗣️ SPEECH SYSTEM
    // ==========================================
    const Speech = {
        say(text) {
            if (!text) return;
            speechSynthesis.cancel();

            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;

            speechSynthesis.speak(u);
        }
    };

    // ==========================================
    // 🌌 FLOATING WORD GAME (PHASE 1 & 3)
    // ==========================================
    const Floating = {
        words: {
            good: ["FOCUS","POWER","TRUTH","CONTROL","DISCIPLINE"],
            bad: ["FEAR","LIE","IMPULSE","CHAOS","LAZY"],
            neutral: ["CITY","WALK","WAIT","WATCH"]
        },

        start() {
            this.stop();

            state.wordInterval = setInterval(() => {

                if (state.locked || state.silenceActive) return;

                const type =
                    Math.random() > 0.7 ? "bad" :
                    Math.random() > 0.4 ? "good" : "neutral";

                const wordList = this.words[type];
                const word = wordList[Math.floor(Math.random() * wordList.length)];

                const el = document.createElement("div");
                el.className = `floating word-${type}`;
                el.innerText = word;
                el.style.left = Math.random() * 90 + "vw";

                el.onclick = () => {
                    if (type === "good") {
                        state.score += 5;
                        Audio.play("win");
                    }
                    if (type === "bad") {
                        state.score -= 10;
                        Audio.play("fail");
                    }

                    UI.updateScore();
                    el.classList.add("blast");
                    setTimeout(() => el.remove(), 200);
                };

                document.body.appendChild(el);

                setTimeout(() => el.remove(), 5000);

            }, 1500);
        },

        stop() {
            if (state.wordInterval) clearInterval(state.wordInterval);
            state.wordInterval = null;

            document.querySelectorAll(".floating").forEach(e => e.remove());
        }
    };

    // ==========================================
    // ⏱️ PHASE ENGINE (MAIN LOOP)
    // ==========================================
    const Phase = {

        startGamePhase() {
            state.phase = 1;
            Floating.start();

            this.startTimer(300, () => {
                this.startLearningPhase();
            });
        },

        startLearningPhase() {
            state.phase = 2;

            Floating.stop();

            UI.showLearning(true);

            Speech.say("Learning phase started. Follow instructions carefully.");

            this.startSilence(state.silenceMinutes * 60, () => {
                this.startDynamicPhase();
            });
        },

        startDynamicPhase() {
            state.phase = 3;

            UI.showLearning(false);
            Floating.start();

            const duration = state.score > 0 ? 600 : 180;

            this.startTimer(duration, () => {
                this.saveRun();
                this.startGamePhase();
            });
        },

        startTimer(seconds, callback) {

            if (state.timerInterval) clearInterval(state.timerInterval);

            let t = seconds;
            UI.updateTimer(t);

            state.timerInterval = setInterval(() => {
                t--;
                UI.updateTimer(t);

                if (t <= 0) {
                    clearInterval(state.timerInterval);
                    callback();
                }

            }, 1000);
        },

        startSilence(seconds, callback) {

            state.silenceActive = true;

            UI.showBreath(true);

            let t = seconds;

            const timer = setInterval(() => {

                t--;

                if (t <= 0) {
                    clearInterval(timer);
                    state.silenceActive = false;
                    UI.showBreath(false);
                    callback();
                }

            }, 1000);
        },

        saveRun() {
            state.history.push(state.score);

            if (state.history.length > state.maxHistory) {
                state.history.shift();
            }

            if (state.history.length >= state.maxHistory) {
                state.history = [];
                state.score = 0;
            }
        }
    };

    // ==========================================
    // 🖥️ UI SYSTEM
    // ==========================================
    const UI = {

        updateScore() {
            document.getElementById("score-display").innerText =
                "POINTS: " + state.score;
        },

        updateTimer(t) {
            const m = Math.floor(t / 60).toString().padStart(2, "0");
            const s = (t % 60).toString().padStart(2, "0");
            document.getElementById("timer").innerText = `${m}:${s}`;
        },

        showLearning(v) {
            document.getElementById("learning").style.display = v ? "block" : "none";
        },

        showBreath(v) {
            document.getElementById("breath").style.display = v ? "block" : "none";
        }
    };

    // ==========================================
    // 🚀 INIT
    // ==========================================
    return {
        init() {
            Audio.init();
            Phase.startGamePhase();
            UI.updateScore();
            console.log("🔥 KAMIZEN ENGINE v2 READY");
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        }
    };

})();

window.onload = () => KamizenEngine.init();
