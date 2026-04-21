/**
 * 🧠 KAMIZEN ENGINE CORE — AURA SYSTEM STABLE BUILD
 * Reflejos vs Conciencia + Engaño Visual + Aprendizaje
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE CORE
    // ==========================================
    const state = {
        score: 0,
        lang: "en",
        phase: 1,

        missionActive: false,
        silenceActive: false,

        timer: 0,
        interval: null,
        wordInterval: null
    };

    // ==========================================
    // 🔊 AUDIO SYSTEM
    // ==========================================
    const Audio = {
        bg: null,
        win: null,
        fail: null,

        init() {
            this.bg = document.getElementById("bg");
            this.win = document.getElementById("win");
            this.fail = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.3;
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
    // 🌌 WORD SYSTEM
    // ==========================================
    const words = {
        power: ["WILL","VISION","HONOR","COURAGE","BUILD","RISE","FAITH","DISCIPLINE","STRENGTH","VICTORY"],
        risk: ["NOISE","EXCUSE","QUITTING","EGO","HATE","CHAOS","LAZY","FEAR","LIE","ANGER"],
        silence: ["CALM","LISTEN","WAIT","PEACE","PRAY","INSIDE","BREATHE","STILL","SOUL","FOCUS"]
    };

    // ==========================================
    // 🎮 FLOATING SYSTEM (REFLEXES VS CONSCIOUSNESS)
    // ==========================================
    const Floating = {

        start() {
            this.stop();

            state.wordInterval = setInterval(() => {

                if (state.phase !== 1) return;

                const r = Math.random();

                let type =
                    r > 0.65 ? "risk" :
                    r > 0.35 ? "power" : "silence";

                const list = words[type];
                const word = list[Math.floor(Math.random() * list.length)];

                // ============================
                // 🧠 VISUAL DECEPTION ENGINE
                // ============================
                const trick = Math.random() < 0.4;

                let visualType = type;

                if (trick) {
                    if (type === "power") visualType = "risk";
                    else if (type === "risk") visualType = "power";
                    else visualType = "silence";
                }

                const el = document.createElement("div");
                el.className = `floating word-${visualType}`;
                el.innerText = word;
                el.style.left = Math.random() * 90 + "vw";

                if (trick) {
                    el.style.transform = "scale(1.15)";
                    el.style.filter = "blur(0.3px)";
                }

                // =====================================
                // 🧠 REAL LOGIC (NO SE DEJA ENGAÑAR)
                // =====================================
                el.onmousedown = () => {

                    if (type === "power") {
                        state.score += 10;
                        Audio.play("win");
                    }

                    if (type === "risk") {
                        state.score -= 15;
                        Audio.play("fail");
                    }

                    if (type === "silence") {
                        state.score += 5;
                        Audio.play("win");
                    }

                    UI.updateScore();
                    explain(word, type);

                    el.classList.add("blast");
                    setTimeout(() => el.remove(), 300);
                };

                const game = document.getElementById("game");
                if (game) game.appendChild(el);

                setTimeout(() => el.remove(), 5000);

            }, 1100);
        },

        stop() {
            clearInterval(state.wordInterval);
            state.wordInterval = null;
            document.querySelectorAll(".floating").forEach(e => e.remove());
        }
    };

    // ==========================================
    // ⏱️ TIMER ENGINE
    // ==========================================
    const Timer = {

        start(seconds, cb) {

            clearInterval(state.interval);

            state.timer = seconds;
            UI.updateTimer(state.timer);

            state.interval = setInterval(() => {

                state.timer--;
                UI.updateTimer(state.timer);

                if (state.timer <= 0) {
                    clearInterval(state.interval);
                    cb();
                }

            }, 1000);
        }
    };

    // ==========================================
    // 🧠 LEARNING SYSTEM
    // ==========================================
    const Learning = {

        start() {

            state.phase = 2;

            Floating.stop();

            const learning = document.getElementById("learning");
            if (learning) learning.style.display = "block";

            const story = state.lang === "en"
                ? "Not everything with color means truth."
                : "No todo lo que brilla es verdad.";

            const analysis = state.lang === "en"
                ? "Your mind must learn patterns, not reactions."
                : "Tu mente debe aprender patrones, no reacciones.";

            const storyEl = document.getElementById("story");
            const analysisEl = document.getElementById("analysis");

            if (storyEl) storyEl.innerText = story;
            if (analysisEl) analysisEl.innerText = analysis;

            Speech.say(story);
            Speech.say(analysis);

            Breath.start(360, () => {
                Game.runPhase3();
            });
        }
    };

    // ==========================================
    // 🧘 BREATH SYSTEM
    // ==========================================
    const Breath = {

        start(seconds, cb) {

            state.silenceActive = true;

            const el = document.getElementById("breath");
            if (!el) return cb();

            el.style.display = "block";

            let t = seconds;

            const i = setInterval(() => {

                t--;

                if (t <= 0) {
                    clearInterval(i);
                    el.style.display = "none";
                    state.silenceActive = false;
                    cb();
                }

            }, 1000);
        }
    };

    // ==========================================
    // 🎮 GAME FLOW
    // ==========================================
    const Game = {

        start() {
            state.phase = 1;
            Floating.start();

            Timer.start(300, () => {
                Learning.start();
            });
        },

        runPhase3() {
            state.phase = 3;

            Floating.start();

            const time = state.score > 0 ? 600 : 180;

            Timer.start(time, () => {
                this.start();
            });
        }
    };

    // ==========================================
    // 📊 UI SYSTEM
    // ==========================================
    const UI = {

        updateScore() {
            const el = document.getElementById("score-display");
            if (el) el.innerText = "POINTS: " + state.score;
        },

        updateTimer(t) {
            const m = Math.floor(t / 60).toString().padStart(2, "0");
            const s = (t % 60).toString().padStart(2, "0");

            const el = document.getElementById("timer");
            if (el) el.innerText = `${m}:${s}`;
        }
    };

    // ==========================================
    // 🧠 EXPLANATION ENGINE
    // ==========================================
    function explain(word, type) {

        const msg =
            state.lang === "en"
                ? `${word} → category: ${type}. Learn meaning, not emotion.`
                : `${word} → categoría: ${type}. Aprende significado, no emoción.`;

        const el = document.getElementById("explain");
        if (el) el.innerText = msg;

        Speech.say(msg);
    }

    // ==========================================
    // 🚀 INIT
    // ==========================================
    return {

        init() {
            Audio.init();
            Game.start();
            UI.updateScore();
        },

        changeLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        },

        reset() {
            location.reload();
        }
    };

})();

window.onload = () => KamizenEngine.init();
