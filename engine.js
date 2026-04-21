/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO / AURA BY MAY ROGA LLC
 * FULL SYSTEM RESTORE + LEARNING ENGINE + DECEPTION LOGIC
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
    // 🌌 WORD SYSTEM (FULL DICCIONARY PRESERVED)
    // ==========================================
    const words = {
        power: [
            "WILL","VISION","HONOR","COURAGE","BUILD","RISE",
            "FAITH","DISCIPLINE","STRENGTH","VICTORY"
        ],
        risk: [
            "NOISE","EXCUSE","QUITTING","EGO","HATE","CHAOS",
            "LAZY","FEAR","LIE","ANGER"
        ],
        silence: [
            "CALM","LISTEN","WAIT","PEACE","PRAY","INSIDE",
            "BREATHE","STILL","SOUL","FOCUS"
        ]
    };

    // ==========================================
    // 🎮 FLOATING SYSTEM (WITH DECEPTION)
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

                const el = document.createElement("div");
                el.className = `floating word-${type}`;
                el.innerText = word;
                el.style.left = Math.random() * 90 + "vw";

                // 🎭 DECEPTION LOGIC (IMPORTANT FOR LEARNING)
                const trick = Math.random() < 0.3;

                if (trick) {
                    if (type === "power") el.style.borderColor = "red";
                    if (type === "risk") el.style.borderColor = "green";
                }

                el.onclick = () => {

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
                    el.remove();
                };

                document.getElementById("game").appendChild(el);
                setTimeout(() => el.remove(), 5000);

            }, 900);
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

            document.getElementById("learning").style.display = "block";

            const story = state.lang === "en"
                ? "Not everything with color means truth."
                : "No todo lo que brilla es verdad.";

            const analysis = state.lang === "en"
                ? "Your mind must learn patterns, not reactions."
                : "Tu mente debe aprender patrones, no reacciones.";

            document.getElementById("story").innerText = story;
            document.getElementById("analysis").innerText = analysis;

            Speech.say(story);
            Speech.say(analysis);

            Breath.start(360, () => {
                Game.runPhase3();
            });
        }
    };

    // ==========================================
    // 🧘 BREATH SYSTEM (AUTO)
    // ==========================================
    const Breath = {

        start(seconds, cb) {

            state.silenceActive = true;

            const el = document.getElementById("breath");
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
            document.getElementById("score-display").innerText =
                "POINTS: " + state.score;
        },

        updateTimer(t) {
            const m = Math.floor(t / 60).toString().padStart(2, "0");
            const s = (t % 60).toString().padStart(2, "0");

            document.getElementById("timer").innerText = `${m}:${s}`;
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

        document.getElementById("explain").innerText = msg;

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
