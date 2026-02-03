import React, { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

async function playSound(layers) {
  if (!layers) return;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  layers.forEach(async (layer) => {
    try {
      const res = await fetch(`/sounds/${layer.name}.mp3`);
      const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = audioCtx.createGain();
      gain.gain.value = layer.volume;
      source.connect(gain).connect(audioCtx.destination);
      source.start(0);
    } catch (e) { console.warn(e); }
  });
}

export default function App() {
  const [initData, setInitData] = useState(null);
  const [level, setLevel] = useState(0); // 0: loading, 1: relief, 2: depth
  const [actions, setActions] = useState([]);

  const handleStart = async (data) => {
    setInitData(data);
    const res = await fetch(`http://localhost:8000/level1`);
    const l1 = await res.json();
    playSound(l1.sound?.layers);
    setLevel(1);
    
    // Carga microacciones con sentido vital
    fetch(`http://localhost:8000/microactions/generate/1`, {method: 'POST'})
      .then(r => r.json()).then(setActions);
  };

  if (level === 0) return <LoadingScreen onReady={handleStart} />;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Landscape level={level} stage={initData.stage} />
      
      {/* UI Flotante: Las microacciones aparecen como susurros de la vida */}
      <div style={styles.actionLayer}>
        {actions.slice(0, 2).map((a, i) => (
          <div key={i} style={styles.actionCard}>
            {a.action} — <small>Es parte del equilibrio</small>
          </div>
        ))}
      </div>

      {level === 1 && initData.is_premium && (
        <button style={styles.btnDeep} onClick={() => setLevel(2)}>
          DESCENDER A LO PROFUNDO
        </button>
      )}

      {/* Estilos Globales para animaciones impresionantes */}
      <style>{`
        @keyframes drift { from { transform: rotate(0deg) translateX(10px); } to { transform: rotate(360deg) translateX(10px); } }
        @keyframes pulse-sky { 0% { filter: brightness(1); } 50% { filter: brightness(1.2); } 100% { filter: brightness(1); } }
      `}</style>
    </div>
  );
}

const Landscape = ({ level, stage }) => {
  const isNight = stage === "night";
  
  return (
    <div style={{
      width: "100%", height: "100%", transition: "all 5s ease",
      background: level === 1 
        ? (isNight ? "radial-gradient(circle, #0f2027, #203a43, #2c5364)" : "linear-gradient(to bottom, #74ebd5, #acb6e5)")
        : "radial-gradient(circle at center, #23074d, #000000)",
      animation: "pulse-sky 10s infinite alternate"
    }}>
      {/* Capas del Nivel 2: Mucho más agresivas y profundas */}
      {level === 2 && (
        <>
          <div className="nebula" style={{ position: "absolute", width: "150%", height: "150%", background: "url('/nebula.png')", opacity: 0.4, animation: "drift 60s infinite linear" }} />
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", width: "2px", height: "2px", background: "white",
              left: Math.random() * 100 + "%", top: Math.random() * 100 + "%",
              boxShadow: "0 0 10px white", animation: `pulse ${2 + Math.random() * 3}s infinite`
            }} />
          ))}
        </>
      )}
      
      {/* Capas Nivel 1: El sol o la luna imponente */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: level === 2 ? "300px" : "150px",
        height: level === 2 ? "300px" : "150px",
        borderRadius: "50%",
        background: isNight ? "#f5f3ce" : "#fff9d1",
        boxShadow: isNight ? "0 0 80px #f5f3ce" : "0 0 100px #ffcc33",
        transition: "all 4s cubic-bezier(0.4, 0, 0.2, 1)"
      }} />
    </div>
  );
};

const styles = {
  actionLayer: { position: "absolute", top: "10%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", pointerEvents: "none" },
  actionCard: { padding: "10px 20px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", color: "white", borderRadius: "20px", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.2)" },
  btnDeep: { position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", padding: "15px 30px", background: "none", border: "1px solid white", color: "white", cursor: "pointer", backdropFilter: "blur(5px)" }
};
