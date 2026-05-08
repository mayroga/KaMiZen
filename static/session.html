<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>KAMIZEN LIFE SYSTEM - CORE SESSION</title>

    <style>
        :root {
            --bg: #0b1220;
            --card: #111a2e;
            --primary: #3b82f6;
            --success: #22c55e;
            --danger: #ef4444;
            --text: #ffffff;
            --dim: #94a3b8;
            --btn-response: #1d4ed8; /* Azul intenso para bloques de respuesta */
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            width: 100%;
            min-height: 100%;
            overflow-x: hidden;
            background: #000;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: var(--text);
        }

        /* =========================
           BACKGROUND SYSTEM
        ========================= */
        .container {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: -10;
            overflow: hidden;
        }

        .slide {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            opacity: 0;
            transition: opacity 2s ease-in-out;
            transform: scale(1.04);
        }

        .slide.active { opacity: 1; }

        .overlay {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle, rgba(0,0,0,0.10) 20%, rgba(0,0,0,0.85) 100%);
            pointer-events: none;
            z-index: 1;
        }

        /* =========================
           APP UI
        ========================= */
        #app {
            position: relative;
            z-index: 5;
            width: 100%;
            max-width: 700px;
            margin: auto;
            padding: 20px;
        }

        .card {
            background: rgba(17, 26, 46, 0.82);
            backdrop-filter: blur(8px);
            padding: 20px;
            border-radius: 16px;
            margin: 15px 0;
            box-shadow: 0 10px 25px rgba(0,0,0,0.45);
            border: 1px solid rgba(255,255,255,0.08);
        }

        /* =========================
           BOTONES DE RESPUESTA (AZULES)
        ========================= */
        .response-button {
            display: block;
            width: 100%;
            background: var(--btn-response);
            color: white;
            padding: 20px;
            border-radius: 14px;
            margin: 10px 0;
            border: 2px solid rgba(255,255,255,0.3);
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            cursor: default;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            transition: transform 0.2s;
        }

        /* =========================
           BOTÓN SKIP (ROJO / SALTAR)
        ========================= */
        .skip-btn {
            background: var(--danger);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
            margin: 10px auto;
            display: block;
            width: fit-content;
            transition: 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .skip-btn:hover {
            background: #ff0000;
            transform: scale(1.1);
            box-shadow: 0 0 15px var(--danger);
        }

        /* =========================
           BREATHING & UTILS
        ========================= */
        .breath-circle {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            margin: 20px auto;
            border: 4px solid var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: breathe 6s infinite ease-in-out;
        }

        @keyframes breathe {
            0%, 100% { transform: scale(0.85); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; border-color: var(--success); }
        }

        .main-btn {
            background: var(--primary);
            color: white;
            padding: 16px;
            border-radius: 12px;
            border: none;
            width: 100%;
            font-weight: bold;
            font-size: 18px;
            cursor: pointer;
            text-transform: uppercase;
        }

        input {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            border: none;
            background: #1f2937;
            color: white;
            text-align: center;
            margin-bottom: 10px;
            font-size: 20px;
        }

        .center { text-align: center; }
        .small { font-size: 13px; color: var(--dim); }
    </style>
</head>

<body>

<div class="container">
    <div id="img1" class="slide active"></div>
    <div id="img2" class="slide"></div>
    <div class="overlay"></div>
</div>

<div id="app">

    <div class="card center">
        <h2 style="color:var(--primary);">KAMIZEN LIFE SYSTEM</h2>
        <p class="small">Neural Training • Awareness • Discipline</p>

        <div style="margin-top:20px;">
            <input type="number" id="missionSelector" min="1" max="49" value="1" />
            <button class="main-btn" onclick="jumpToMission()">LOAD STORY & MISSION</button>
        </div>
    </div>

    <!-- AREA DE RESPUESTAS DINÁMICAS -->
    <div id="screen" class="card">
        <div id="responseContainer">
            <div class="response-button">
                <h3>System Ready</h3>
                <p>Waiting for mission activation...</p>
            </div>
        </div>
        
        <!-- BOTÓN SKIP PARA SALTAR BLOQUES -->
        <button class="skip-btn" onclick="clearScreen()">SKIP / NEXT</button>
    </div>

    <div class="card center">
        <div class="breath-circle"><span>FOCUS</span></div>
        <p class="small">Breathing Module</p>
    </div>

</div>

<script>
    /* LÓGICA DE FONDOS NATURALES */
    const slides = [document.getElementById('img1'), document.getElementById('img2')];
    let currentIdx = 0;
    const topics = ['space', 'ocean', 'landscape', 'forest', 'mountain', 'stars'];

    function fetchImage() {
        const randomID = Math.floor(Math.random() * 10000);
        return `https://picsum.photos/1920/1080?random=${randomID}&topic=${topics[Math.floor(Math.random()*topics.length)]}`;
    }

    slides[0].style.backgroundImage = `url('${fetchImage()}')`;
    slides[1].style.backgroundImage = `url('${fetchImage()}')`;

    function rotateBackground() {
        const nextIdx = (currentIdx + 1) % 2;
        const imgUrl = fetchImage();
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => {
            slides[nextIdx].style.backgroundImage = `url('${imgUrl}')`;
            slides[currentIdx].classList.remove('active');
            slides[nextIdx].classList.add('active');
            currentIdx = nextIdx;
        };
    }
    // Rotación cada 14 segundos
    setInterval(rotateBackground, 14000);

    /* LÓGICA DE MISIONES Y BOTONES DE RESPUESTA */
    function jumpToMission() {
        const val = document.getElementById('missionSelector').value;
        const container = document.getElementById('responseContainer');
        
        // Crear un nuevo botón azul para la respuesta
        const respBtn = document.createElement('div');
        respBtn.className = 'response-button';
        respBtn.innerHTML = `<h3>MISSION ${val} ACTIVE</h3><p>Neural link successful. Focus on the visual flow.</p>`;
        
        // Reemplazar contenido anterior (limpieza de rastro)
        container.innerHTML = ''; 
        container.appendChild(respBtn);

        if (typeof window.engineJump === 'function') window.engineJump(val);
    }

    /* FUNCIÓN SKIP: LIMPIA TODO RASTRO DE DATOS */
    function clearScreen() {
        const container = document.getElementById('responseContainer');
        
        // Eliminación física de nodos para asegurar limpieza total de caché visual
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Notificación de limpieza
        const emptyBlock = document.createElement('div');
        emptyBlock.className = 'response-button';
        emptyBlock.style.background = 'rgba(255,255,255,0.1)';
        emptyBlock.innerHTML = `<p>SYSTEM RESET: READY FOR NEXT INPUT</p>`;
        container.appendChild(emptyBlock);
    }
</script>

<script src="/static/js/engine.js"></script>

</body>
</html>
