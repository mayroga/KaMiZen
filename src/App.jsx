import React, { useState, useEffect } from "react";

// --- Función para reproducir sonido en paralelo ---
async function playSound(layers) {
  if (!layers || layers.length === 0) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await Promise.all(
      layers.map(async (layer) => {
        const res = await fetch(`/sounds/${layer.name}.mp3`);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = layer.loop || false;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = layer.volume || 1;
        source.connect(gainNode).connect(audioCtx.destination);
        source.start(0);
      })
    );
  } catch (err) {
    console.warn("Error cargando audio:", err);
  }
}

export default function App() {
  const [lang, setLang] = useState("es");
  const [userId] = useState("guest");
  const [stageData, setStageData] = useState(null);
  const [level1Data, setLevel1Data] = useState(null);
  const [level2Data, setLevel2Data] = useState(null);
  const [showLevel2, setShowLevel2] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Preload Animation mientras cargan datos ---
  const Preloader = () => {
    const clouds = [];
    const particles = [];
    for (let i = 0; i < 5; i++) {
      const top = Math.random() * 50;
      const left = Math.random() * 100;
      const size = 50 + Math.random() * 50;
      clouds.push(
        <div
          key={`cloud-${i}`}
          style={{
            position: "absolute",
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size / 2}px`,
            background: "rgba(255,255,255,0.3)",
            borderRadius: "50%",
            animation: `cloudMove ${20 + Math.random() * 10}s linear infinite`,
          }}
        ></div>
      );
    }

    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      particles.push(
        <div
          key={`particle-${i}`}
          style={{
            position: "absolute",
            top: `${top}%`,
            left: `${left}%`,
            width: "4px",
            height: "4px",
            background: "white",
            borderRadius: "50%",
            animation: `particleMove ${5 + Math.random() * 5}s linear infinite alternate`,
          }}
        ></div>
      );
    }

    return (
      <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#223344", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "100%", height: "100%" }}>{clouds}{particles}</div>
        <div style={{ position: "absolute", bottom: "10%", width: "100%", textAlign: "center", color: "white", fontSize: "1.8em" }}>
          🌿 Relájate... Cargando experiencia 🌿
        </div>
      </div>
    );
  };

  // --- Inicialización ---
  useEffect(() => {
    async function initApp() {
      setLoading(true);

      try {
        // Fetch inicial
        const resInit = await fetch(`/init?user_id=${userId}&lang=${lang}`);
        const dataInit = await resInit.json();
        setStageData(dataInit);
        if (dataInit.is_premium || dataInit.random_gift) setShowLevel2(true);

        // Fetch Nivel 1 en paralelo
        const resLvl1 = await fetch(`/level1?user_id=${userId}`);
        const dataLvl1 = await resLvl1.json();
        setLevel1Data(dataLvl1);

        // Reproducir sonido Nivel 1 sin bloquear render
        playSound(dataLvl1.sound?.layers);
      } catch (err) {
        console.error("Error inicializando app:", err);
      }

      setLoading(false);
    }

    initApp();
  }, [lang, userId]);

  // --- Cargar Nivel 2 ---
  const loadLevel2 = async () => {
    try {
      const res = await fetch(`/level2?user_id=${userId}`);
      const data = await res.json();
      if (data.error) return alert(data.error);
      setLevel2Data(data);
      playSound(data.sound?.layers);
    } catch (err) {
      console.error("Error cargando nivel 2:", err);
    }
  };

  if (loading) return <Preloader />;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      {/* Animaciones CSS */}
      <style>{`
        @keyframes cloudMove {0%{transform: translateX(-10%);}100%{transform: translateX(110%);}}
        @keyframes waterMove {0%{transform: translateY(0);}100%{transform: translateY(-10px);}}
        @keyframes lightPulse {0%{opacity:0.6;}100%{opacity:0.2;}}
        @keyframes particleMove {0%{transform: translateY(0);}100%{transform: translateY(-20px);}}
      `}</style>

      {/* Selector idioma */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 100 }}>
        <select value={lang} onChange={e => setLang(e.target.value)}>
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="zh">中文</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      {/* Nivel 1 */}
      {level1Data && !level2Data && <Landscape level={1} />}

      {/* Botón Nivel 2 */}
      {showLevel2 && !level2Data && (
        <button
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            padding: "10px 20px",
            fontSize: "1em",
            borderRadius: "5px",
            cursor: "pointer"
          }}
          onClick={loadLevel2}
        >
          Continuar a experiencia profunda
        </button>
      )}

      {/* Nivel 2 */}
      {level2Data && <Landscape level={2} />}
    </div>
  );
}

// --- Componente Paisaje ---
const Landscape = ({ level }) => {
  const layers = [];
  if (level === 1) {
    layers.push(<div key="sky" style={{ position: "absolute", width: "100%", height: "100%", background: "linear-gradient(to top, #223344, #445566)" }} />);
    layers.push(<div key="sun" style={{ position: "absolute", top: "20%", left: "50%", width: "100px", height: "100px", borderRadius: "50%", background: "#FFD700" }} />);
  } else {
    layers.push(<div key="sky" style={{ position: "absolute", width: "100%", height: "100%", background: "linear-gradient(to top, #001122, #004466)", transition: "all 3s" }} />);
    layers.push(<CloudLayer key="clouds" count={8} />);
    layers.push(<WaterLayer key="water" />);
    layers.push(<LightLayer key="light" />);
    layers.push(<ParticleLayer key="particles" />);
  }
  return <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>{layers}</div>;
};

// --- Capas Nivel 2 ---
const CloudLayer = ({ count }) => {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const top = Math.random() * 50;
    const left = Math.random() * 100;
    const size = 50 + Math.random() * 100;
    clouds.push(
      <div key={i} style={{ position: "absolute", top: `${top}%`, left: `${left}%`, width: `${size}px`, height: `${size / 2}px`, background: "rgba(255,255,255,0.3)", borderRadius: "50%", animation: `cloudMove ${30 + Math.random() * 20}s linear infinite` }}></div>
    );
  }
  return <>{clouds}</>;
};

const WaterLayer = () => (
  <div style={{ position: "absolute", bottom: 0, width: "100%", height: "30%", background: "linear-gradient(to top, #004466, #002233)", animation: "waterMove 6s ease-in-out infinite alternate" }}></div>
);

const LightLayer = () => (
  <div style={{ position: "absolute", top: 0, width: "100%", height: "100%", background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.05), transparent 70%)", animation: "lightPulse 10s ease-in-out infinite alternate" }}></div>
);

const ParticleLayer = () => {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    particles.push(<div key={i} style={{ position: "absolute", top: `${top}%`, left: `${left}%`, width: "4px", height: "4px", background: "white", borderRadius: "50%", animation: `particleMove ${5 + Math.random() * 5}s linear infinite alternate` }}></div>);
  }
  return <>{particles}</>;
};
