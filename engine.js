/**
 * 🧠 KAMIZEN ENGINE vSTABLE PRO CLEAN
 * NO FREEZE + NO SPAM + NO LOOP OVERLOAD + UI BRIDGE SAFE
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE
    // ==========================================
    const state = {
        score: 0,
        focus: 100,
        energy: 100,
        lang: "en",
        mission: null,
        missionId: 1,
        locked: false,
        silenceActive: false,
        silenceTime: 20,

        floatInterval: null,
        breathActive: false,
        timerInterval: null,

        running: false
    };

    const player = { name: "Player", hero: "Kamizen" };

    // ==========================================
    // 🔒 SAFE LOCK (NO FREEZE BODY)
    // ==========================================
    const Lock = {
        on() {
            state.locked = true;
        },
        off() {
            state.locked = false;
        },
        is() {
            return state.locked;
        }
    };

    // ==========================================
    // 🔊 AUDIO SAFE
    // ==========================================
    const AudioSystem = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.3;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            try {
                if (type === "win" && this.ok) this.ok.play();
                if (type === "bad" && this.bad) this.bad.play();
            } catch {}
        }
    };

    // ==========================================
    // 🗣️ SPEECH SAFE (ANTI FREEZE)
    // ==========================================
    const Speech = {
        last: 0,

        say(text) {
            const now = Date.now();
            if (now - this.last < 1200) return;
            this.last = now;

            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = state.lang === "en" ? "en-US" : "es-ES";
                u.rate = 0.9;
                window.speechSynthesis.speak(u);
            } catch {}
        }
    };

    // ==========================================
    // 🌍 TEXT CLEAN
    // ==========================================
    const TEXT = {
        en: {
            points: "POINTS",
            focus: "FOCUS",
            energy: "ENERGY",
            silence: "SILENCE",
            inhale: "Inhale",
            exhale: "Exhale",
            lost: "Attention lost"
        },
        es: {
            points: "PUNTOS",
            focus: "FOCO",
            energy: "ENERGÍA",
            silence: "SILENCIO",
            inhale: "Inhala",
            exhale: "Exhala",
            lost: "Atención perdida"
        }
    };

    // ==========================================
    // 🖥️ UI BRIDGE SAFE
    // ==========================================
    const UI = {

        push(extra = {}) {
            if (!window.updateSessionUI) return;

            window.updateSessionUI({
                points: state.score,
                focus: state.focus,
                energy: state.energy,
                timerText: extra.timerText || "",
                html: extra.html || ""
            });
        },

        updateTop() {
            this.push();
        },

        clearOptions() {
            const el = document.getElementById("missionBox");
            if (el) el.innerHTML = "";
        }
    };

    // ==========================================
    // 🎯 FLOATING SYSTEM SAFE (NO OVERLOAD)
    // ==========================================
    const Floating = {
        start() {

            if (state.floatInterval) clearInterval(state.floatInterval);

            state.floatInterval = setInterval(() => {

                if (state.locked || state.silenceActive) return;
                if (document.hidden) return;

                this.spawn();

            }, 2500);
        },

        spawn() {

            const words = ["FOCUS", "TRUTH", "CALM", "FEAR", "POWER"];
            const val = Math.random() > 0.5 ? 5 : -5;

            const el = document.createElement("div");
            el.className = "floating";
            el.textContent = words[Math.floor(Math.random() * words.length)];
            el.style.position = "absolute";
            el.style.left = Math.random() * 90 + "vw";
            el.style.top = Math.random() * 70 + "vh";
            el.style.color = val > 0 ? "#00ff88" : "#ff3b3b";

            el.onclick = () => {
                state.score += val;
                state.focus += val > 0 ? 1 : -2;
                state.energy += val > 0 ? 1 : -1;

                AudioSystem.play(val > 0 ? "win" : "bad");
                UI.updateTop();

                el.remove();
            };

            document.body.appendChild(el);

            setTimeout(() => el.remove(), 4000);
        }
    };

    // ==========================================
    // 🧘 SILENCE SAFE (NO LOOP FREEZE)
    // ==========================================
    const Silence = {

        active: false,

        start() {

            if (this.active) return;

            this.active = true;
            state.silenceActive = true;

            UI.clearOptions();

            let time = state.missionId <= 7 ? 20 :
                       state.missionId <= 14 ? 180 :
                       state.missionId <= 21 ? 300 : 600;

            if (state.timerInterval) clearInterval(state.timerInterval);

            state.timerInterval = setInterval(() => {

                time--;

                const min = Math.floor(time / 60);
                const sec = String(time % 60).padStart(2, "0");

                UI.push({
                    timerText: `${TEXT[state.lang].silence}: ${min}:${sec}`
                });

                if (time <= 0) {
                    clearInterval(state.timerInterval);
                    this.stop();
                }

            }, 1000);

            this.breathLoop();
        },

        breathLoop() {

            if (state.breathActive) return;
            state.breathActive = true;

            const loop = async () => {

                const breath = document.getElementById("breath");

                while (this.active) {

                    if (breath) breath.style.transform = "scale(2)";
                    Speech.say(TEXT[state.lang].inhale);
                    await new Promise(r => setTimeout(r, 3000));

                    if (!this.active) break;

                    if (breath) breath.style.transform = "scale(1)";
                    Speech.say(TEXT[state.lang].exhale);
                    await new Promise(r => setTimeout(r, 3000));
                }

                state.breathActive = false;
            };

            loop();
        },

        stop() {
            this.active = false;
            state.silenceActive = false;

            const breath = document.getElementById("breath");
            if (breath) breath.style.transform = "scale(1)";

            Mission.next();
        }
    };

    // ==========================================
    // 📂 MISSION SAFE
    // ==========================================
    const Mission = {

        async next() {

            try {
                const res = await fetch("/api/mission/next");
                const m = await res.json();

                state.mission = m;
                state.missionId = m.id;

                this.render(m);

            } catch {}
        },

        render(m) {

            const box = document.getElementById("missionBox");
            if (!box) return;

            const story = m.blocks?.[0]?.text?.[state.lang] || "";
            const analysis = m.blocks?.[1]?.text?.[state.lang] || "";
            const options = m.blocks?.[2]?.options || [];

            box.innerHTML = `
                <div><b>${story}</b></div>
                <div style="color:#00f2ff;margin-top:10px">${analysis}</div>
            `;

            Speech.say(story);

            setTimeout(() => {
                let html = "";
                options.forEach(o => {
                    html += `<div class="option" onclick="window.Engine.choose(${options.indexOf(o)})">${o.text[state.lang]}</div>`;
                });
                box.innerHTML += `<div id="optBox">${html}</div>`;
            }, 3000);

            state._options = options;

            UI.updateTop();
        }
    };

    // ==========================================
    // 🎮 DECISION SAFE
    // ==========================================
    function choose(i) {

        const opt = state._options?.[i];
        if (!opt) return;

        Lock.on();

        if (opt.correct === true) {
            state.score += 20;
            state.focus += 2;
            state.energy += 2;
            AudioSystem.play("win");
        } else {
            state.score -= 10;
            state.focus -= 2;
            AudioSystem.play("bad");
        }

        UI.updateTop();

        setTimeout(() => {
            Lock.off();
            Silence.start();
        }, 1500);
    }

    // ==========================================
    // 🚀 INIT SAFE
    // ==========================================
    function init() {

        if (state.running) return;
        state.running = true;

        AudioSystem.init();
        Floating.start();

        UI.updateTop();
        Mission.next();
    }

    // ==========================================
    // 🌐 PUBLIC API (MATCH SESSION.HTML)
    // ==========================================
    return {
        start: init,
        init,
        next: () => Mission.next(),
        back: () => Mission.next(),
        restart: () => location.reload(),

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            if (state.mission) Mission.render(state.mission);
        },

        choose
    };

})();

// EXPORT GLOBAL
window.Engine = KamizenEngine;
window.onload = null;
