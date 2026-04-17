(() => {

    // ==============================
    // 🧠 SINGLE STATE (ONLY BRAIN)
    // ==============================
    const State = {
        missionId: 1,
        mission: null,
        locked: false,
        lang: "en",
        score: 0,

        floatingWords: [],
        audioEnabled: true,

        power: {
            focus: 0,
            discipline: 0,
            wisdom: 0
        }
    };

    // ==============================
    // 🔒 LOCK SYSTEM (CRITICAL FLOW CONTROL)
    // ==============================
    const Lock = {
        enable() {
            State.locked = true;
            document.body.style.pointerEvents = "none";
        },

        disable() {
            State.locked = false;
            document.body.style.pointerEvents = "auto";
        },

        isLocked() {
            return State.locked;
        }
    };

    // ==============================
    // 🔊 AUDIO SYSTEM
    // ==============================
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

    // ==============================
    // 🗣️ SPEECH ENGINE
    // ==============================
    const Speech = {
        speak(text) {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = State.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.85;
            u.pitch = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // ==============================
    // 🧩 UI CORE (ONLY RENDER HERE)
    // ==============================
    const UI = {

        setText(id, text) {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        },

        showOverlay(title, text) {
            const o = document.getElementById("overlay");
            document.getElementById("overlayTitle").innerText = title;
            document.getElementById("overlayText").innerText = text;
            o.style.display = "flex";
        },

        hideOverlay() {
            document.getElementById("overlay").style.display = "none";
        },

        breath(state) {
            const b = document.getElementById("breath");
            if (!b) return;

            if (state === "in") {
                b.style.transform = "scale(1.6)";
                b.style.background = "#00f2ff";
            }

            if (state === "out") {
                b.style.transform = "scale(1)";
                b.style.background = "#0044ff";
            }
        },

        clearOptions() {
            const o = document.getElementById("options");
            if (o) o.innerHTML = "";
        }
    };

    // ==============================
    // 🌐 API LAYER (ONLY DATA)
    // ==============================
    const API = {
        async getMission(id) {
            const res = await fetch(`/api/mission/${id}`);
            if (!res.ok) throw new Error("Mission not found");
            return await res.json();
        }
    };

    // ==============================
    // 🎮 MISSION ENGINE (CORE LOOP)
    // ==============================
    const Mission = {

        async load(id) {
            Lock.enable();

            try {
                const data = await API.getMission(id);

                State.mission = data;
                State.missionId = id;

                if (data.ui?.floating_words) {
                    State.floatingWords = data.ui.floating_words;
                }

                Renderer.render(data);

            } catch (e) {
                console.error("Mission load error:", e);
            }

            Lock.disable();
        },

        next() {
            State.missionId++;
            if (State.missionId > 35) State.missionId = 1;
            return this.load(State.missionId);
        }
    };

    // ==============================
    // 🎯 RENDER SYSTEM (NO LOGIC HERE)
    // ==============================
    const Renderer = {

        render(m) {

            const story = m.blocks.find(b => b.type === "story");
            const analysis = m.blocks.find(b => b.type === "analysis");
            const decision = m.blocks.find(b => b.type === "decision");

            UI.clearOptions();

            UI.setText("story", story.text[State.lang]);
            Speech.speak(story.text[State.lang]);

            setTimeout(() => {
                UI.setText("analysis", analysis.text[State.lang]);
                Speech.speak(analysis.text[State.lang]);
            }, 2500);

            setTimeout(() => {
                Options.render(decision.options);
            }, 5000);
        }
    };

    // ==============================
    // 🎯 OPTIONS SYSTEM (4 RANDOMIZED)
    // ==============================
    const Options = {

        render(options) {
            const container = document.getElementById("options");
            container.innerHTML = "";

            // shuffle (IMPORTANT)
            const shuffled = [...options].sort(() => Math.random() - 0.5);

            shuffled.forEach(opt => {
                const btn = document.createElement("button");
                btn.innerText = opt.text[State.lang];

                btn.onclick = () => Decision.handle(opt);

                container.appendChild(btn);
            });
        }
    };

    // ==============================
    // ⚖️ DECISION SYSTEM (LOCK FLOW)
    // ==============================
    const Decision = {

        async handle(opt) {

            if (Lock.isLocked()) return;

            Lock.enable();

            UI.clearOptions();

            if (opt.correct) {
                Audio.play("ok");
                Speech.speak("Correct decision");
                State.score += 10;
                Power.up("wisdom");
            } else {
                Audio.play("bad");
                Speech.speak("Incorrect decision");
                State.score -= 5;
                Power.down("focus");
            }

            await TVid.run(State.mission, opt.correct);

            await Utils.wait(800);

            Mission.next();
        }
    };

    // ==============================
    // ⚡ POWER SYSTEM (RPG CORE)
    // ==============================
    const Power = {

        up(type) {
            if (type === "wisdom") State.power.wisdom += 1;
            if (type === "focus") State.power.focus += 1;
            if (type === "discipline") State.power.discipline += 1;
        },

        down(type) {
            if (type === "focus") State.power.focus = Math.max(0, State.power.focus - 1);
            if (type === "discipline") State.power.discipline = Math.max(0, State.power.discipline - 1);
        }
    };

    // ==============================
    // 🧠 TVID SYSTEM (BEHAVIOR ENGINE)
    // ==============================
    const TVid = {

        async run(mission) {

            const theme = (mission.theme || "").toUpperCase();

            UI.showOverlay("TVID", "Processing behavior response...");
            Lock.enable();

            if (theme.includes("ANGER")) {
                await Breathing.run(3, "anger control");
                Speech.speak("Control anger through breath");
            }

            else if (theme.includes("FEAR")) {
                await Breathing.run(3, "fear processing");
                Speech.speak("Fear is information, not danger");
            }

            else if (theme.includes("DIGITAL")) {
                await Breathing.run(2, "attention recovery");
                Speech.speak("Recover your attention");
            }

            else if (theme.includes("TRUTH")) {
                await Breathing.run(2, "truth alignment");
                Speech.speak("Truth builds identity");
            }

            else if (theme.includes("PRESSURE")) {
                await Breathing.run(4, "decision clarity");
                Speech.speak("Pause creates intelligence");
            }

            UI.hideOverlay();
            Lock.disable();
        }
    };

    // ==============================
    // 🌬️ BREATHING SYSTEM (SYNCED)
    // ==============================
    const Breathing = {

        async run(cycles, reason) {

            console.log("Breathing:", reason);

            for (let i = 0; i < cycles; i++) {

                Speech.speak("Inhale");
                UI.breath("in");

                await Utils.wait(2500);

                Speech.speak("Hold");

                await Utils.wait(1500);

                Speech.speak("Exhale");
                UI.breath("out");

                await Utils.wait(2500);
            }
        }
    };

    // ==============================
    // 🌫️ FLOATING WORDS (REAL CONTROLLED)
    // ==============================
    const Floating = {

        start() {

            setInterval(() => {

                if (Lock.isLocked()) return;
                if (!State.floatingWords.length) return;

                const el = document.createElement("div");
                el.className = "floating";

                el.innerText =
                    State.floatingWords[
                        Math.floor(Math.random() * State.floatingWords.length)
                    ];

                el.style.left = Math.random() * 100 + "vw";

                // click interaction (IMPORTANT)
                el.onclick = () => {
                    Speech.speak("Word selected: " + el.innerText);
                    State.score += 1;
                    el.remove();
                };

                document.body.appendChild(el);

                setTimeout(() => el.remove(), 4000);

            }, 1200);
        }
    };

    // ==============================
    // ⏱️ UTILITIES
    // ==============================
    const Utils = {
        wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    };

    // ==============================
    // 🚀 INIT (SINGLE ENTRY POINT)
    // ==============================
    async function init() {

        Audio.init();

        const name = prompt("Enter your name");
        const hero = prompt("Hero name");

        UI.setText("hero", hero);

        await Mission.load(1);

        Floating.start();
    }

    window.KamizenEngine = {
        init,
        Mission
    };

    init();

})();
