/**
 * 🧠 KAMIZEN ENGINE CORE — FINAL MERGED SYSTEM v3
 * AURA + PHASE LOOP + DICTIONARY SYSTEM + DIAGNOSIS ENGINE
 * SINGLE SOURCE OF TRUTH (NO CONFLICTS / NO FREEZE)
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE CORE (UNIFIED SYSTEM)
    // ==========================================
    const state = {
        score: 0,
        lang: "en",

        missionId: 1,
        mission: null,

        phase: 1, // 1 FLOAT GAME | 2 LEARNING | 3 DYNAMIC LOOP

        timer: 300,
        silenceTime: 180,
        silenceActive: false,

        locked: false,

        wordInterval: null,
        timerInterval: null,

        history: [],
        maxHistory: 3,

        // 🧠 AURA DICTIONARY (EXPANDED SYSTEM)
        words: {
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
        }
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
            this.win = document.getElementById("ok");
            this.fail = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.25;
                this.bg.playbackRate = 1.05;
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
    // 🌌 FLOATING WORD SYSTEM (CORE GAME)
    // ==========================================
    const Floating = {

        start() {
            this.stop();

            state.wordInterval = setInterval(() => {

                if (state.locked || state.silenceActive) return;

                const r = Math.random();

                let category, list, css;

                if (r > 0.6) {
                    category = "power";
                    list = state.words.power;
                    css = "word-good";
                } else if (r > 0.3) {
                    category = "risk";
                    list = state.words.risk;
                    css = "word-bad";
                } else {
                    category = "silence";
                    list = state.words.silence;
                    css = "word-neutral";
                }

                const word = list[Math.floor(Math.random() * list.length)];

                const el = document.createElement("div");
                el.className = `floating ${css}`;
                el.innerText = word;

                el.style.left = (Math.random() * 85 + 5) + "vw";
                el.style.animationDuration = (category === "silence" ? 3000 : 5000) + "ms";

                // 🎯 TRICK MODE (visual deception)
                const trick = Math.random() < 0.25;
                if (trick) el.style.borderWidth = "5px";

                el.onclick = () => {

                    if (category === "power") {
                        state.score += 10;
                        Audio.play("win");
                    } 
                    else if (category === "risk") {
                        state.score -= 15;
                        Audio.play("fail");
                    } 
                    else {
                        state.score += 5;
                        Audio.play("win");
                    }

                    UI.updateScore();

                    el.remove();
                };

                document.body.appendChild(el);

                setTimeout(() => el.remove(), 5000);

            }, 1200);
        },

        stop() {
            clearInterval(state.wordInterval);
            state.wordInterval = null;
            document.querySelectorAll(".floating").forEach(e => e.remove());
        }
    };

    // ==========================================
    // 🧠 DIAGNOSIS SYSTEM
    // ==========================================
    const Diagnosis = {
        getProfile() {
            const s = state.score;

            if (s >= 150) {
                return {
                    title: { en: "The Architect", es: "El Arquitecto" },
                    desc: {
                        en: "You see through illusions. Total control.",
                        es: "Ves a través de ilusiones. Control total."
                    }
                };
            }

            if (s >= 70) {
                return {
                    title: { en: "The Warrior", es: "El Guerrero" },
                    desc: {
                        en: "Strong focus, but distractions still exist.",
                        es: "Fuerza alta, pero aún hay distracciones."
                    }
                };
            }

            if (s >= 0) {
                return {
                    title: { en: "The Student", es: "El Aprendiz" },
                    desc: {
                        en: "You are learning to control attention.",
                        es: "Estás aprendiendo a controlar tu atención."
                    }
                };
            }

            return {
                title: { en: "The Warning", es: "La Advertencia" },
                desc: {
                    en: "Chaos is leading your decisions.",
                    es: "El caos está guiando tus decisiones."
                }
            };
        }
    };

    // ==========================================
    // ⏱️ PHASE ENGINE (MAIN LOOP SYSTEM)
    // ==========================================
    const Phase = {

        startGame() {
            state.phase = 1;
            Floating.start();

            this.timer(300, () => this.startLearning());
        },

        startLearning() {
            state.phase = 2;

            Floating.stop();

            UI.showLearning(true);

            Speech.say("Learning phase activated.");

            this.silence(state.silenceTime, () => this.startDynamic());
        },

        startDynamic() {
            state.phase = 3;

            UI.showLearning(false);

            Floating.start();

            const duration = state.score > 0 ? 600 : 180;

            this.timer(duration, () => {
                this.saveRun();
                this.startGame();
            });
        },

        timer(seconds, cb) {
            clearInterval(state.timerInterval);

            let t = seconds;
            UI.updateTimer(t);

            state.timerInterval = setInterval(() => {
                t--;
                UI.updateTimer(t);

                if (t <= 0) {
                    clearInterval(state.timerInterval);
                    cb();
                }

            }, 1000);
        },

        silence(seconds, cb) {
            state.silenceActive = true;

            UI.showBreath(true);

            let t = seconds;

            const timer = setInterval(() => {
                t--;

                if (t <= 0) {
                    clearInterval(timer);
                    state.silenceActive = false;
                    UI.showBreath(false);
                    cb();
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
            const el = document.getElementById("learning");
            if (el) el.style.display = v ? "block" : "none";
        },

        showBreath(v) {
            const el = document.getElementById("breath");
            if (el) el.style.display = v ? "block" : "none";
        }
    };

    // ==========================================
    // 🚀 INIT
    // ==========================================
    return {
        init() {
            Audio.init();
            UI.updateScore();
            Phase.startGame();
            console.log("🔥 KAMIZEN ENGINE v3 FULL MERGED READY");
        },

        changeLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        },

        reset() {
            state.score = 0;
            location.reload();
        }
    };

})();

window.onload = () => KamizenEngine.init();
