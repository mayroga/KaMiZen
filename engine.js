// ======================================================
// 🧠 KAMIZEN ENGINE CORE V3 - SINGLE BRAIN SYSTEM
// ======================================================

const KamizenEngine = (() => {

    // =========================
    // 🔥 GLOBAL STATE (ONLY SOURCE OF TRUTH)
    // =========================
    const State = {
        missionId: 1,
        mission: null,
        locked: false,
        lang: "en",
        score: 0,
        floatingWords: [],
        audioEnabled: true,
        hero: "",
        realName: "",
        power: {
            focus: 0,
            discipline: 0,
            wisdom: 0
        }
    };

    // =========================
    // 🔒 LOCK SYSTEM (ANTI FREEZE + FLOW CONTROL)
    // =========================
    const Lock = {
        on() {
            State.locked = true;
            document.body.style.pointerEvents = "none";
        },
        off() {
            State.locked = false;
            document.body.style.pointerEvents = "auto";
        },
        is() {
            return State.locked;
        }
    };

    // =========================
    // 🔊 AUDIO ENGINE (SYNC SAFE)
    // =========================
    const Audio = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.loop = true;
                this.bg.volume = 0.25;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (!State.audioEnabled) return;

            if (type === "ok" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        }
    };

    // =========================
    // 🗣️ SPEECH ENGINE
    // =========================
    const Speech = {
        say(text) {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = State.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.85;
            u.pitch = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // =========================
    // 🌐 API CONTRACT (NO CRASH)
    // =========================
    const API = {
        async mission(id) {
            try {
                const res = await fetch(`/api/mission/${id}`);
                if (!res.ok) throw new Error("Mission error");
                return await res.json();
            } catch (e) {
                return {
                    id: 0,
                    theme: "SAFE MODE",
                    ui: { floating_words: ["CALM", "FOCUS"] },
                    blocks: [
                        {
                            type: "story",
                            text: { en: "System recovery mode", es: "Modo seguro activo" }
                        },
                        {
                            type: "analysis",
                            text: { en: "Fallback activated", es: "Sistema de respaldo activo" }
                        },
                        {
                            type: "decision",
                            options: [
                                { code: "OK", text: { en: "Continue", es: "Continuar" }, correct: true }
                            ]
                        }
                    ]
                };
            }
        }
    };

    // =========================
    // 🔄 MISSION CONTROL
    // =========================
    const Mission = {

        async load(id) {

            Lock.on();

            const data = await API.mission(id);

            State.mission = data;
            State.missionId = id;

            State.floatingWords = data.ui?.floating_words || [];

            Renderer.draw(data);

            Lock.off();
        },

        next() {
            State.missionId++;
            if (State.missionId > 35) State.missionId = 1;
            this.load(State.missionId);
        }
    };

    // =========================
    // 🎨 RENDER ENGINE (NO LOGIC)
    // =========================
    const Renderer = {

        draw(m) {

            const story = m.blocks.find(b => b.type === "story");
            const analysis = m.blocks.find(b => b.type === "analysis");
            const decision = m.blocks.find(b => b.type === "decision");

            UI.clear();

            UI.set("story", story.text[State.lang]);
            Speech.say(story.text[State.lang]);

            setTimeout(() => {
                UI.set("analysis", analysis.text[State.lang]);
                Speech.say(analysis.text[State.lang]);
            }, 2500);

            setTimeout(() => {
                Options.render(decision.options);
            }, 5000);
        }
    };

    // =========================
    // 🎯 OPTIONS (4 RANDOM SAFE)
    // =========================
    const Options = {

        render(options) {

            const box = document.getElementById("options");
            box.innerHTML = "";

            const shuffled = [...options]
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);

            shuffled.forEach(opt => {

                const btn = document.createElement("button");
                btn.innerText = opt.text[State.lang];

                btn.onclick = () => Decision.choose(opt);

                box.appendChild(btn);
            });
        }
    };

    // =========================
    // ⚖️ DECISION CORE (LOCK FLOW)
    // =========================
    const Decision = {

        async choose(opt) {

            if (Lock.is()) return;

            Lock.on();
            UI.clear();

            if (opt.correct) {
                Audio.play("ok");
                Speech.say("Correct choice");
                State.score += 10;
                Power.up("wisdom");
            } else {
                Audio.play("bad");
                Speech.say("Incorrect choice");
                State.score -= 5;
                Power.down("focus");
            }

            await TVid.run(State.mission);

            await wait(800);

            Mission.next();
        }
    };

    // =========================
    // ⚡ POWER SYSTEM
    // =========================
    const Power = {

        up(type) {
            State.power[type]++;
        },

        down(type) {
            State.power[type] = Math.max(0, State.power[type] - 1);
        }
    };

    // =========================
    // 🧠 TVID ENGINE (BEHAVIOR LOGIC)
    // =========================
    const TVid = {

        async run(m) {

            const theme = (m.theme || "").toUpperCase();

            UI.overlay("TVID ACTIVE", "Processing response...");
            Lock.on();

            if (theme.includes("ANGER")) {
                await breathe(3);
                Speech.say("Control emotion through breath");
            }

            else if (theme.includes("FEAR")) {
                await breathe(3);
                Speech.say("Fear is information");
            }

            else if (theme.includes("DIGITAL")) {
                await breathe(2);
                Speech.say("Recover attention");
            }

            else if (theme.includes("TRUTH")) {
                await breathe(2);
                Speech.say("Truth builds identity");
            }

            else if (theme.includes("PRESSURE")) {
                await breathe(4);
                Speech.say("Pause creates intelligence");
            }

            UI.hideOverlay();
            Lock.off();
        }
    };

    // =========================
    // 🌬️ BREATH SYSTEM (SYNCED VOICE)
    // =========================
    async function breathe(cycles) {

        for (let i = 0; i < cycles; i++) {

            Speech.say("Inhale");
            UI.breath("in");

            await sleep(2500);

            Speech.say("Hold");

            await sleep(1500);

            Speech.say("Exhale");
            UI.breath("out");

            await sleep(2500);
        }
    }

    // =========================
    // 🌫️ FLOATING WORDS (CLICKABLE REAL)
    // =========================
    const Floating = {

        start() {

            setInterval(() => {

                if (Lock.is()) return;
                if (!State.floatingWords.length) return;

                const el = document.createElement("div");
                el.className = "floating";

                const word = State.floatingWords[
                    Math.floor(Math.random() * State.floatingWords.length)
                ];

                el.innerText = word;
                el.style.left = Math.random() * 100 + "vw";

                el.onclick = () => {
                    Speech.say("Selected " + word);
                    State.score++;
                    el.remove();
                };

                document.body.appendChild(el);

                setTimeout(() => el.remove(), 4000);

            }, 1200);
        }
    };

    // =========================
    // 🎛️ UI CORE ONLY
    // =========================
    const UI = {

        set(id, text) {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        },

        clear() {
            document.getElementById("options").innerHTML = "";
        },

        overlay(t, txt) {
            const o = document.getElementById("overlay");
            document.getElementById("overlayTitle").innerText = t;
            document.getElementById("overlayText").innerText = txt;
            o.style.display = "flex";
        },

        hideOverlay() {
            document.getElementById("overlay").style.display = "none";
        },

        breath(state) {
            const b = document.getElementById("breath");
            if (!b) return;

            b.style.transform = state === "in" ? "scale(1.6)" : "scale(1)";
            b.style.background = state === "in" ? "#00f2ff" : "#0033ff";
        }
    };

    // =========================
    // ⏱️ UTIL
    // =========================
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // =========================
    // 🚀 INIT (ONLY ENTRY POINT)
    // =========================
    async function init() {

        Audio.init();

        const hero = prompt("Hero name");
        UI.set("hero", hero);

        await Mission.load(1);

        Floating.start();
    }

    window.KamizenEngine = { init };

    init();

})();
