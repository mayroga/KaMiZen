import React, { useState, useEffect } from "react";

// --- Función para reproducir sonido con Web Audio API ---
async function playSound(layers) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (const layer of layers) {
      fetch(`/sounds/${layer.name}.mp3`)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = layer.volume;
          source.loop = layer.loop;
          source.connect(gainNode).connect(audioCtx.destination);
          source.start(0);
        });
    }
  } catch (err) {
    console.warn("Error al cargar audio:", err);
  }
}

export default function App() {
  const [lang, setLang] = useState("es");
  const [userId, setUserId] = useState("guest");
  const [loading, setLoading] = useState(true);
  const [level1Data, setLevel1Data] = useState(null);
  const [level2Data, setLevel2Data] = useState(null);
  const [showLevel2, setShowLevel2] = useState(false);

  // --- Carga inicial ---
  useEffect(() => {
    async function initApp() {
      setLoading(true);

      // Mostrar preload movido mientras carga
      const res = await fetch(`/init?user_id=${userId}&lang=${lang}`);
      const data = await res.json();

      // Cargar Nivel 1
      const res1 = await fetch(`/level1?user_id=${userId}`);
      const lvl1 = await res1.json();
      setLevel1Data(lvl1);
      playSound(lvl1.sound.layers);

      // Si es premium o regalo aleatorio, mostrar Nivel 2
      if (data.is_premium || data.random_gift) {
        setShowLevel2(true);
      }

      setLoading(false);
    }

    initApp();
  }, [lang, userId]);

  // --- Cargar Nivel 2 al dar clic ---
  const loadLevel2 = async () => {
    const res = await fetch(`/level2?user_id=${userId}`);
    const data = await res.json();
    if (data.error) return alert(data.error);
    setLevel2Data(data);
    playSound(data.sound.layers);
  };

  // --- Pantalla de precarga animada ---
  const Preloader = () => {
    const clouds = [];
    const particles = [];
    for (let i = 0; i < 5; i++) {
      const top = Math.random() * 50;
      const left = Math.random() * 100;
      const size = 50 + Math.random() * 50;
      clouds.push(
        <div key={i} style={{
          position: "absolute",
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size/2}px`,
          background: "rgba(255,255,255,0.3)",
          borderRadius: "50%",
          animation: `cloudMove ${20 + Math.random()*10}s linear infinite`
        }}></div>
      );
    }

    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      particles.push(
        <div key={i} style={{
          position: "absolute",
          top: `${top}%`,
          left: `${left}%`,
          width: "4px",
          height: "4px",
          background: "white",
          borderRadius: "50%",
          animation: `particleMove ${5 + Math.random()*5}s linear infinite alternate`
        }}></div>
      );
    }

    // Audio de fondo opcional
    useEffect(() => {
      playSound([{ name: "ambient", volume: 0.2, loop: true }]);
    }, []);

    return (
      <div style={{width:"100vw",height:"100vh",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",width:"100%",height:"100%",background:"linear-gradient(to top,#223344,#445566)"}}></div>
        {clouds}
        {particles}
        <div style={{position:"absolute",bottom:"10%",width:"100%",textAlign:"center",color:"white",fontSize:"1.8em"}}>
          🌿 Relájate... Cargando experiencia 🌿
        </div>
      </div>
    );
  };

  if (loading) return <Preloader />;

  // --- Componente paisajes dinámicos ---
  const Landscape = ({level, data}) => {
    const layers = [];
    if(level===1){
      layers.push(<div key="sky" style={{position:"absolute",width:"100%",height:"100%",background:"linear-gradient(to top,#223344,#445566)"}}></div>);
      layers.push(<div key="sun" style={{position:"absolute",top:"20%",left:"50%",width:"100px",height:"100px",borderRadius:"50%",background:"#FFD700"}}></div>);
    } else {
      layers.push(<div key="sky" style={{position:"absolute",width:"100%",height:"100%",background:"linear-gradient(to top,#001122,#004466)",transition:"all 3s"}}></div>);
      layers.push(<CloudLayer key="clouds" count={8} />);
      layers.push(<WaterLayer key="water" />);
      layers.push(<LightLayer key="light" />);
      layers.push(<ParticleLayer key="particles" />);
    }
    return <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden"}}>{layers}</div>
  };

  const CloudLayer = ({count})=>{
    const clouds = [];
    for(let i=0;i<count;i++){
      const top = Math.random()*50;
      const left = Math.random()*100;
      const size = 50 + Math.random()*100;
      clouds.push(<div key={i} style={{
        position:"absolute",top:`${top}%`,left:`${left}%`,width:`${size}px`,height:`${size/2}px`,
        background:"rgba(255,255,255,0.3)",borderRadius:"50%",
        animation:`cloudMove ${30+Math.random()*20}s linear infinite`
      }}></div>);
    }
    return <>{clouds}</>;
  };

  const WaterLayer = ()=>{
    return <div style={{
      position:"absolute",bottom:0,width:"100%",height:"30%",
      background:"linear-gradient(to top,#004466,#002233)",
      animation:"waterMove 6s ease-in-out infinite alternate"
    }}></div>
  };

  const LightLayer = ()=>{
    return <div style={{
      position:"absolute",top:0,width:"100%",height:"100%",
      background:"radial-gradient(circle at 50% 30%, rgba(255,255,255,0.05), transparent 70%)",
      animation:"lightPulse 10s ease-in-out infinite alternate"
    }}></div>
  };

  const ParticleLayer = ()=>{
    const particles = [];
    for(let i=0;i<20;i++){
      const top = Math.random()*100;
      const left = Math.random()*100;
      particles.push(<div key={i} style={{
        position:"absolute",top:`${top}%`,left:`${left}%`,width:"4px",height:"4px",background:"white",borderRadius:"50%",
        animation:`particleMove ${5+Math.random()*5}s linear infinite alternate`
      }}></div>);
    }
    return <>{particles}</>;
  };

  return (
    <div style={{width:"100vw",height:"100vh",overflow:"hidden"}}>
      {/* Selección idioma */}
      <div style={{position:"absolute", top:10, right:10, zIndex:100}}>
        <select value={lang} onChange={e=>setLang(e.target.value)}>
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="zh">中文</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      {/* Nivel 1 */}
      {level1Data && !showLevel2 && <Landscape level={1} data={level1Data.landscape} />}

      {/* Botón para Nivel 2 */}
      {showLevel2 && !level2Data && (
        <button style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)"}} onClick={loadLevel2}>
          Continuar a experiencia profunda
        </button>
      )}

      {/* Nivel 2 */}
      {showLevel2 && level2Data && <Landscape level={2} data={level2Data.landscape} />}
    </div>
  );
}
