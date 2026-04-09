/**
 * AL CIELO - Core Engine
 * Powered by AURA BY MAY ROGA LLC
 */

const AlCieloEngine = {
    currentSession: null,
    currentBlockIndex: 0,
    audioPlayer: new Audio(),
    backgroundMusic: new Audio(),
    imageContainer: document.getElementById('bg-image-container'),
    contentOverlay: document.getElementById('content-overlay'),
    timerDisplay: document.getElementById('timer-display'),
    
    // Configuración de visualización
    imageInterval: 7000, // 7 segundos por imagen
    imageIndex: 0,
    images: [], // Se llena con las 80+ imágenes de la sesión

    init(sessionData) {
        this.currentSession = sessionData;
        this.currentBlockIndex = 0;
        this.setupBackgroundMusic();
        this.startImageCycle();
        this.processBlock();
    },

    setupBackgroundMusic() {
        // La música sube de nivel según la sesión
        const trackLevel = Math.min(this.currentSession.level, 3);
        this.backgroundMusic.src = `/static/audio/ambient_lvl_${trackLevel}.mp3`;
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
        this.backgroundMusic.play();
    },

    startImageCycle() {
        this.images = this.currentSession.image_config.pool;
        setInterval(() => {
            this.imageIndex = (this.imageIndex + 1) % this.images.length;
            this.renderImage();
        }, this.imageInterval);
        this.renderImage();
    },

    renderImage() {
        const imgUrl = this.images[this.imageIndex];
        this.imageContainer.innerHTML = `
            <div class="zoom-image" style="background-image: url('${imgUrl}');"></div>
        `;
        // El CSS debe manejar el zoom in constante (Ken Burns Effect)
    },

    async processBlock() {
        if (this.currentBlockIndex >= this.currentSession.blocks.length) {
            this.completeSession();
            return;
        }

        const block = this.currentSession.blocks[this.currentBlockIndex];
        this.applyTransparency(this.currentSession.transparency_alpha);

        switch (block.type) {
            case 'voice':
            case 'story':
            case 'strategy':
                await this.executeNarration(block);
                break;
            case 't_vid_part':
                await this.executeTVid(block);
                break;
            case 'silence_challenge':
                await this.executeSilence(block);
                break;
            case 'quiz':
                await this.executeQuiz(block);
                break;
        }

        this.currentBlockIndex++;
        // Tiempo de espera de 3 segundos para lectura antes del siguiente bloque
        setTimeout(() => this.processBlock(), 3000);
    },

    applyTransparency(alpha) {
        this.contentOverlay.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;
    },

    executeNarration(block) {
        return new Promise((resolve) => {
            this.showText(block.text.es);
            this.playVoice(block.text.es, () => resolve());
        });
    },

    executeTVid(block) {
        return new Promise(async (resolve) => {
            let timeLeft = block.duration; // Máximo 60s según instrucción
            this.showText("T-VID: " + block.goal.es);
            
            for (let msg of block.voice_guidance) {
                await this.playVoiceSync(msg);
                // Distribuye el tiempo de respiración
            }
            setTimeout(() => resolve(), 1000);
        });
    },

    executeSilence(block) {
        return new Promise((resolve) => {
            this.timerDisplay.style.display = 'block';
            let seconds = block.duration_min * 60;
            
            const interval = setInterval(() => {
                let m = Math.floor(seconds / 60);
                let s = seconds % 60;
                this.timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
                
                if (seconds <= 0) {
                    clearInterval(interval);
                    this.timerDisplay.style.display = 'none';
                    resolve();
                }
                seconds--;
            }, 1000);

            // Opción de Saltar con Castigo
            this.showSkipButton(() => {
                clearInterval(interval);
                this.applyPunishment(block.on_skip);
            });
        });
    },

    applyPunishment(penalty) {
        this.playVoice(penalty.power_advice, () => {
            // Lógica de retraso: Retroceder índice de bloques
            this.currentBlockIndex = Math.max(0, this.currentBlockIndex - 3);
            alert("PENALIZACIÓN: " + penalty.power_advice);
            this.processBlock();
        });
    },

    playVoice(text, onEnd) {
        // Integración con el motor de voz de AL CIELO
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9; // Voz profesional y pausada
        utterance.onend = onEnd;
        window.speechSynthesis.speak(utterance);
    },

    playVoiceSync(text) {
        return new Promise(resolve => this.playVoice(text, resolve));
    },

    showText(msg) {
        const textElement = document.getElementById('text-content');
        textElement.classList.remove('fade-in');
        void textElement.offsetWidth; // Trigger reflow
        textElement.innerText = msg;
        textElement.classList.add('fade-in');
    },

    completeSession() {
        this.showText("Sesión Finalizada. Tu nivel ha ascendido.");
        // Lógica para guardar progreso en la DB de SmartCargo
    }
};

// Estilos dinámicos para el efecto de Zoom
const style = document.createElement('style');
style.innerHTML = `
    .zoom-image {
        width: 100%;
        height: 100vh;
        background-size: cover;
        background-position: center;
        animation: kenBurns 10s infinite alternate ease-in-out;
    }
    @keyframes kenBurns {
        from { transform: scale(1); }
        to { transform: scale(1.4); }
    }
    #content-overlay {
        transition: background-color 2s ease;
    }
`;
document.head.appendChild(style);
