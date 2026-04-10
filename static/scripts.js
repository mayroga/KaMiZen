class AlCieloEngine {
    constructor() {
        this.sessions = [];
        this.currentSessionIdx = 0;
        this.currentBlockIdx = 0;
        this.language = 'en'; // Default
        this.audio = new Audio();
        this.synth = window.speechSynthesis;
        
        this.init();
    }

    async init() {
        try {
            // RELACIÓN BACKEND-FRONTEND: Carga de datos
            const response = await fetch('/api/content');
            const data = await response.json();
            this.sessions = data.sessions;
            this.setupEventListeners();
            console.log("AL CIELO: Sistema cargado y listo.");
        } catch (error) {
            console.error("Error conectando con el servidor:", error);
            alert("Error de conexión con AURA.");
        }
    }

    setupEventListeners() {
        document.getElementById('btn-es')?.addEventListener('click', () => this.setLanguage('es'));
        document.getElementById('btn-en')?.addEventListener('click', () => this.setLanguage('en'));
        document.getElementById('start-btn')?.addEventListener('click', () => this.startSession());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextBlock());
    }

    setLanguage(lang) {
        this.language = lang;
        document.documentElement.lang = lang;
        console.log(`Idioma cambiado a: ${lang}`);
    }

    startSession() {
        const session = this.sessions[this.currentSessionIdx];
        this.playBackgroundMusic(session.level);
        this.renderBlock();
    }

    playBackgroundMusic(level) {
        // La música se relaciona según el nivel del JSON
        this.audio.src = `/static/audio/level_${level}.mp3`;
        this.audio.loop = true;
        this.audio.volume = 0.3;
        this.audio.play().catch(e => console.log("Interacción de usuario requerida para audio."));
    }

    renderBlock() {
        const session = this.sessions[this.currentSessionIdx];
        const block = session.blocks[this.currentBlockIdx];
        const container = document.getElementById('content-display');

        // Limpiar pantalla antes de nuevo bloque
        container.innerHTML = '';
        container.style.opacity = session.transparency_alpha || 1;

        // Mostrar Texto
        if (block.text) {
            const textEl = document.createElement('h2');
            textEl.innerText = block.text[this.language];
            textEl.className = 'fade-in-text';
            container.appendChild(textEl);
            this.speak(block.text[this.language]);
        }

        // Si es T-VID, activar guías de voz secuenciales
        if (block.type === 't_vid_part') {
            this.runTVid(block);
        }
    }

    speak(text) {
        this.synth.cancel(); // Detener cualquier voz previa
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.language === 'es' ? 'es-ES' : 'en-US';
        utterance.rate = 0.9; // Voz profesional y pausada
        utterance.pitch = 1.0;
        this.synth.speak(utterance);
    }

    runTVid(block) {
        let i = 0;
        const interval = setInterval(() => {
            if (i < block.voice_guidance.length) {
                this.speak(block.voice_guidance[i]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, (block.duration / block.voice_guidance.length) * 1000);
    }

    nextBlock() {
        this.currentBlockIdx++;
        if (this.currentBlockIdx < this.sessions[this.currentSessionIdx].blocks.length) {
            this.renderBlock();
        } else {
            this.currentBlockIdx = 0;
            this.currentSessionIdx++;
            alert("Sesión completada. Elevando nivel...");
            this.startSession();
        }
    }
}

// Arrancar el motor al cargar la ventana
window.onload = () => {
    window.AuraApp = new AlCieloEngine();
};
