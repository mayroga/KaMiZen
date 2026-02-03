import React, { useState } from "react";
import LoadingScreen from "./LoadingScreen";

async function playSound(layers) {
  if (!layers) return;
  try {
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
      } catch (e) { console.warn("Audio layer failed:", layer.name); }
    });
  } catch (e) { console.error("Audio Context error"); }
}

export default function App() {
  const [initData, setInitData] = useState(null);
  const [level, setLevel] = useState(0); 
  const [actions, setActions] = useState([]);

  const handleStart = async (data) => {
    setInitData(data);
    try {
      // Ruta relativa para nivel 1
      const res = await fetch(`/level1`);
      const l1 = await res.json();
      playSound(l1.sound?.layers);
      setLevel(1);
      
      // Carga microacciones con sentido vital
      fetch(`/microactions/generate/1`, {method: 'POST'})
        .then(r => r.json())
        .then(setActions)
        .catch(e => console.log("Actions deferred"));
    } catch (err) {
      setLevel(1); // Entrar aunque falle el fetch para no dejar pantalla blanca
    }
  };

  if (level === 0) return <LoadingScreen onReady={handleStart} />;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Landscape level={level} stage={initData?.stage || "morning"} />
      
      <div style={styles.actionLayer}>
        {actions.slice(0, 2).map((a, i) => (
          <div key={i} style={styles.actionCard}>
            {a.action}
          </div>
        ))}
      </div>

      {level === 1 && (
        <button style={styles.btnDeep} onClick={() => setLevel(2)}>
          DESCENDER A LO PROFUNDO
        </button>
      )}

      <style>{`
        @keyframes drift { from { transform: rotate(0deg) translate(10px); } to { transform: rotate(360deg) translate(10px); } }
        @keyframes pulse-sky { 0% { filter: brightness(1); } 50% { filter: brightness(1.1); } 100% { filter: brightness(1); } }
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
        ? (isNight ? "radial-gradient(circle, #0f2027, #2c5364)" : "linear-gradient(to bottom, #74ebd5, #acb6e5)")
        : "radial-gradient(circle at center, #23074d, #000000)",
      animation: "pulse-sky 10s infinite alternate"
    }}>
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: level === 2 ? "300px" : "150px",
        height: level === 2 ? "300px" : "150px",
        borderRadius: "50%",
        background: isNight ? "#f5f3ce" : "#fff9d1",
        boxShadow: isNight ? "0 0 80px #f5f3ce" : "0 0 100px #ffcc33",
        transition: "all 4s ease-in-out"
      }} />
    </div>
  );
};

const styles = {
  actionLayer: { position: "absolute", top: "10%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", pointerEvents: "none" },
  actionCard: { padding: "12px 25px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(15px)", color: "white", borderRadius: "30px", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", maxWidth: "80%" },
  btnDeep: { position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", padding: "15px 30px", background: "rgba(255,255,255,0.1)", border: "1px solid white", color: "white", cursor: "pointer", borderRadius: "50px", letterSpacing: "2px" }
};
