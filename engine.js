/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO PRO (STABLE VERSION)
 * FIXED: Anti-freeze + Timer Control + Speech Safe + Clean Flow
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 ESTADO GLOBAL
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        missionIndex: 0,
        locked: false,
        mode: "mission",
        backupMode: false
    };

    // =====================================================
    // ⏱️ TIMER MANAGER (ANTI FREEZE)
    // =====================================================
    const Timer = {
        timers: [],
        set(fn, time) {
            const t = setTimeout(fn, time);
            this.timers.push(t);
            return t;
        },
        clearAll() {
            this.timers.forEach(t => clearTimeout(t));
            this.timers = [];
        }
    };

    // =====================================================
    // 🔊 AUDIO SYSTEM
    // =====================================================
    const AudioSystem = {
        init() {
            const bg = document.getElementById("bg_music");
            if (bg) {
                bg.volume = 0.3;
                bg.play().catch(() => {});
            }
        },
        playSuccess() {
            const s = document.getElementById("ok_sound");
            if (s) {
                s.currentTime = 0;
                s.play().catch(() => {});
            }
        },
        playGlass() {
            const g = document.getElementById("bad_sound");
            if (g) {
                g.currentTime = 0;
                g.play().catch(() => {});
            }
        }
    };

    // =====================================================
    // 🗣️ SPEECH SAFE
    // =====================================================
    const Speech = {
        current: null,

        say(text) {
            if (!text) return;

            try {
                speechSynthesis.cancel();

                if (this.current) {
                    this.current.onend = null;
                    this.current.onerror = null;
                }

                const u = new SpeechSynthesisUtterance(text);
                this.current = u;

                u.lang = state.lang === "es" ? "es-ES" : "en-US";
                u.rate = 0.9;

                speechSynthesis.speak(u);

            } catch (e) {
                console.warn("Speech error:", e);
            }
        }
    };

    // =====================================================
    // 🌌 FLOATING SYSTEM (OPTIMIZADO)
    // =====================================================
    const Floating = {

        words: [
            "FOCUS", "CALM", "BREATH", "CONTROL",
            "DISTRACTION", "IMPULSE", "EGO"
        ],

        spawn() {
            if (state.locked || state.mode !== "mission") return;

            const el = document.createElement("div");
            el.className = "floating";
            el.innerText = this.words[Math.floor(Math.random() * this.words.length)];

            el.style.left = (Math.random() * 85 + 5) + "vw";

            el.onclick = () => {
                state.score += 5;
                AudioSystem.playSuccess();

                document.getElementById("points-display").innerText = "POINTS: " + state.score;

                el.style.transform = "scale(4)";
                el.style.opacity = "0";

                setTimeout(() => el.remove(), 200);
            };

            document.body.appendChild(el);

            setTimeout(() => {
                if (el.parentNode) el.remove();
            }, 5000);
        },

        start() {
            setInterval(() => {
                if (!state.locked) this.spawn();
            }, 1800);
        }
    };

    // =====================================================
    // 🧠 DECISION SYSTEM
    // =====================================================
    const Decision = {
        handle(opt) {

            if (state.locked) return;

            state.locked = true;
            Timer.clearAll();

            const box = document.getElementById("explanation-box");
            const explanation = opt.explanation[state.lang];

            let feedback = "";

            if (opt.correct) {
                state.score += 50;
                AudioSystem.playSuccess();
                feedback = (state.lang === "es" ? "ESTRATEGIA CORRECTA:\n" : "CORRECT STRATEGY:\n") + explanation;
            } else {
                state.score -= 40;
                AudioSystem.playGlass();
                feedback = (state.lang === "es" ? "FALLO:\n" : "FAILURE:\n") + explanation;
            }

            box.innerText = feedback;
            box.style.display = "block";

            document.getElementById("points-display").innerText = "POINTS: " + state.score;

            Speech.say(feedback);

            Timer.set(() => {
                box.style.display = "none";
                state.locked = false;
                Mission.next();
            }, 5000);
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM
    // =====================================================
    const Mission = {

        async load() {

            if (state.locked) return;
            state.locked = true;

            try {
                const res = await fetch(`/api/mission/next`);

                if (!res.ok) throw new Error("API FAIL");

                const data = await res.json();
                state.backupMode = false;

                this.render(data);

            } catch (e) {

                console.warn("⚠️ BACKUP MODE");

                state.backupMode = true;
                this.renderBackup();

            } finally {
                state.locked = false;
            }
        },

        render(m) {

            Timer.clearAll();

            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            document.getElementById("story").innerText = story;
            document.getElementById("analysis").innerText = "";
            document.getElementById("options").innerHTML = "";

            Speech.say(story);

            Timer.set(() => {
                document.getElementById("analysis").innerText = analysis;
                Speech.say(analysis);
            }, 3000);

            Timer.set(() => {

                const c = document.getElementById("options");

                decision.options.forEach(opt => {
                    const b = document.createElement("button");
                    b.className = "opt-btn";
                    b.innerText = opt.text[state.lang];
                    b.onclick = () => Decision.handle(opt);
                    c.appendChild(b);
                });

            }, 6000);
        },

        renderBackup() {

            Timer.clearAll();

            const story = state.lang === "es"
                ? "Modo supervivencia activo."
                : "Survival mode active.";

            const analysis = state.lang === "es"
                ? "Tu mente sigue funcionando."
                : "Your mind is still active.";

            document.getElementById("story").innerText = story;
            document.getElementById("analysis").innerText = analysis;

            const c = document.getElementById("options");
            c.innerHTML = "";

            ["WAIT", "MOVE", "OBSERVE"].forEach(txt => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = txt;

                b.onclick = () => {
                    state.score += 5;
                    document.getElementById("points-display").innerText = "POINTS: " + state.score;
                    this.next();
                };

                c.appendChild(b);
            });
        },

        next() {
            this.load();
        }
    };

    // =====================================================
    // 🚀 INIT
    // =====================================================
    return {

        init() {
            AudioSystem.init();
            Floating.start();
            Mission.load();
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            Mission.load();
        }
    };

})();

// =====================================================
// ▶️ AUTO START
// =====================================================
window.onload = () => {
    if (typeof KamizenEngine !== "undefined") {
        KamizenEngine.init();
    }
};
