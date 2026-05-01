const Engine = (() => {

    let state = { running: false, index: 1, busy: false, lang: 'en' };
    let ui = { centerText: null, timer: null, expBox: null, expTitle: null, expBody: null };
    let timers = [];

    // DATA DE ASESORÍA PROFESIONAL
    const pillars = [
        { id: "LIMITS", en: "Set your boundaries to protect your peace.", es: "Pon límites para proteger tu paz." },
        { id: "PERSISTENCE", en: "Never stop until the method works.", es: "No te detengas hasta que el método funcione." },
        { id: "METHOD", en: "Organization is the base of intelligence.", es: "La organización es la base de la inteligencia." },
        { id: "CRITERION", en: "Think for yourself before acting.", es: "Piensa por ti mismo antes de actuar." },
        { id: "VALUE", en: "Money follows those who solve problems.", es: "El dinero sigue a quienes resuelven problemas." },
        { id: "BALANCE", en: "Health is the fuel for your success.", es: "La salud es el combustible de tu éxito." },
        { id: "LOYALTY", en: "Family and loyalty create true wealth.", es: "La familia y la lealtad crean riqueza real." },
        { id: "AUTONOMY", en: "You decide your path, no one else.", es: "Tú decides tu camino, nadie más." },
        { id: "ADAPTATION", en: "Survive and thrive in any environment.", es: "Sobrevive y prospera en cualquier entorno." },
        { id: "LEGACY", en: "What you build today stays forever.", es: "Lo que construyes hoy queda para siempre." }
    ];

    function init(){
        ui.centerText = document.getElementById("centerText");
        ui.timer = document.getElementById("timer");
        ui.expBox = document.getElementById("explanationBox");
        ui.expTitle = document.getElementById("expTitle");
        ui.expBody = document.getElementById("expBody");
    }

    async function start(){
        if(state.running) return;
        state.running = true;

        while(state.running){
            const data = await fetchSession();
            if(!data) { await sleep(2000); continue; }

            state.index = data.index;

            // Secuencia del Asesor
            await storyPhase(data.story);
            await gamePhase(300); // 5 Minutos de Entrenamiento
            await missionPhase(data.mission);
            await gamePhase(300); 
            await breathingPhase(state.index);

            cleanup();
        }
    }

    async function fetchSession(){
        try {
            const res = await fetch("/api/session/start");
            return await res.json();
        } catch(e) { return null; }
    }

    async function storyPhase(story){
        const text = story?.[state.lang] || story?.en || "GET READY";
        render(text);
        speak(text);
        await sleep(6000);
        clear();
    }

    async function missionPhase(mission){
        // Adaptación flexible para cualquier formato de tus JSONs
        const text = mission?.b?.[0]?.tx?.[state.lang] || mission?.t?.[state.lang] || mission?.en || "NEW MISSION";
        render(text);
        await sleep(6000);
        clear();
    }

    async function gamePhase(seconds){
        return new Promise(resolve => {
            let t = seconds;
            const id = setInterval(() => {
                t--;
                if(ui.timer) ui.timer.innerText = formatTime(t);
                spawnWord();
                if(t <= 0){ clearInterval(id); resolve(); }
            }, 1000);
            timers.push(id);
        });
    }

    function spawnWord(){
        const pillar = pillars[Math.floor(Math.random()*pillars.length)];
        const el = document.createElement("div");
        el.className = "word";
        el.innerText = pillar.id;

        el.style.left = (Math.random() * 80 + 10) + "%";
        el.style.top = (Math.random() * 60 + 20) + "%";

        el.onclick = () => {
            // Sonido de Cristal (SFX)
            const sfx = document.getElementById("sfxGlass").cloneNode();
            sfx.volume = 0.4;
            sfx.play();

            // Mostrar Explicación en la esquina
            showExplanation(pillar);

            el.style.transform = "scale(2.5)";
            el.style.opacity = "0";
            setTimeout(() => el.remove(), 200);
        };

        document.body.appendChild(el);
        setTimeout(() => { if(el.parentNode) el.remove(); }, 5000);
    }

    function showExplanation(pillar){
        ui.expTitle.innerText = pillar.id;
        ui.expBody.innerText = pillar[state.lang];
        ui.expBox.style.opacity = "1";
        // Desaparece después de 4 segundos para no saturar
        setTimeout(() => { ui.expBox.style.opacity = "0"; }, 4000);
    }

    async function breathingPhase(index){
        let t = Math.min(30 + index * 2, 120);
        return new Promise(resolve => {
            const id = setInterval(() => {
                t--;
                const action = (t % 4 < 2) ? "INHALE" : "EXHALE";
                render(action);
                if(t <= 0){ clearInterval(id); resolve(); }
            }, 1000);
            timers.push(id);
        });
    }

    function formatTime(s){
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    }

    function render(text){ if(ui.centerText) ui.centerText.innerText = text; }
    function clear(){ if(ui.centerText) ui.centerText.innerText = ""; }
    function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
    function speak(t){ try { const m = new SpeechSynthesisUtterance(t); m.lang="en-US"; speechSynthesis.speak(m); } catch(e){} }

    function cleanup(){
        timers.forEach(t => clearInterval(t));
        timers = [];
    }

    return { init, start };
})();
