<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KaMiZen Elite</title>
    <style>
        *{box-sizing:border-box;margin:0;padding:0;font-family:sans-serif;}
        body{background:#020617;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden;}
        
        /* BANNER PROPAGANDA AZUL */
        #banner {
            width: 100%; background: #1e40af; padding: 12px 0; position: fixed; top: 0;
            white-space: nowrap; overflow: hidden; border-bottom: 1px solid #3b82f6; z-index: 100;
        }
        .track { display: inline-block; animation: scroll 20s linear infinite; font-weight: 800; font-size: 13px; text-transform: uppercase; }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        #app{width:90%; max-width:400px; background:#111827; border-radius:20px; padding:20px; text-align:center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);}
        #logo{font-size:26px; font-weight:bold; background:linear-gradient(90deg,#60a5fa,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; cursor:pointer;}
        
        #panel{background:#020617; padding:15px; border-radius:12px; margin:15px 0; text-align:left; font-size:12px;}
        .bar{height:6px; background:#1e293b; border-radius:10px; margin:4px 0 10px 0; overflow:hidden;}
        .fill{height:100%; background:#3b82f6; width:50%; transition: 0.5s;}
        
        #block{min-height:150px; display:flex; flex-direction:column; justify-content:center; font-size:17px; line-height:1.4;}
        button{width:100%; padding:15px; border-radius:10px; border:none; background:#2563eb; color:white; font-weight:bold; cursor:pointer; margin-top:10px;}
        .opt{background:#374151; margin-top:5px;}
    </style>
</head>
<body>
    <div id="banner">
        <div class="track">
            <span> • PRÓXIMA SESIÓN: 10:00 AM / 06:00 PM • CUPO LIMITADO: 500 PERSONAS • $5.99 ACCESO • SOLO 30 MINUTOS DE PODER • FORJA TU MENTE • </span>
            <span> • PRÓXIMA SESIÓN: 10:00 AM / 06:00 PM • CUPO LIMITADO: 500 PERSONAS • $5.99 ACCESO • SOLO 30 MINUTOS DE PODER • FORJA TU MENTE • </span>
        </div>
    </div>

    <div id="app">
        <div id="logo">KaMiZen</div>
        <p style="font-size:10px; opacity:0.5;">Asesoría Mental de Alto Peso</p>
        
        <div id="panel">
            <div>Disciplina <div class="bar"><div id="d-bar" class="fill"></div></div></div>
            <div>Claridad <div class="bar"><div id="cl-bar" class="fill" style="background:#a78bfa;"></div></div></div>
            <div>Calma <div class="bar"><div id="ca-bar" class="fill" style="background:#10b981;"></div></div></div>
        </div>

        <div id="block">Cargando sistema...</div>
        
        <button id="start-btn">Iniciar Sesión</button>
        <button id="next-btn" style="display:none;">Continuar</button>
    </div>
</body>
</html>
