import React, { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

export default function App() {
  const [data, setData] = useState(null);
  const [level, setLevel] = useState(1);
  const [actions, setActions] = useState([]);
  const [quote, setQuote] = useState("");

  const quotes = [
    "Respirar es el primer acto de rebeldía contra la muerte.",
    "Tu cuerpo es el único lugar donde vivirás toda la vida.",
    "El agua que bebes hoy es la misma que fluyó hace millones de años.",
    "No estás solo; 8 mil millones de corazones laten contigo ahora."
  ];

  const handleInit = (initData) => {
    setData(initData);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    fetch(`/level1`).then(res => res.json()).then(lvl => {
      setActions([
        { id: 1, text: "Hidrata tus células: El combustible de la existencia.", time: "Ahora" },
        { id: 2, text: "Siente tu pulso: Estás aquí, estás vivo.", time: "Constante" }
      ]);
    });
  };

  if (!data) return <LoadingScreen onReady={handleInit} />;

  return (
    <div style={{ width: "100vw", height: "100vh", color: "white", overflow: "hidden", position: "relative" }}>
      {/* FONDO DINÁMICO QUE CAMBIA POR HORA */}
      <DynamicBackground level={level} stage={data.stage} />

      {/* TEXTO DE SABIDURÍA (El "gancho" emocional) */}
      <div style={styles.quoteContainer}>
        <h2 style={styles.quoteText}>"{quote}"</h2>
      </div>

      {/* MICROACCIONES (Lo productivo) */}
      <div style={styles.actionGrid}>
        {actions.map(action => (
          <div key={action.id} style={styles.actionCard}>
            <span style={{ fontSize: "0.8rem", color: "#ffd700" }}>● ACCIÓN VITAL</span>
            <p style={{ margin: "10px 0", fontSize: "1.1rem" }}>{action.text}</p>
            <small style={{ opacity: 0.6 }}>Prioridad: {action.time}</small>
          </div>
        ))}
      </div>

      {/* BOTÓN DE TRASCENDENCIA */}
      <button 
        style={styles.levelBtn} 
        onClick={() => setLevel(level === 1 ? 2 : 1)}
      >
        {level === 1 ? "PROFUNDIZAR EXISTENCIA" : "VOLVER AL ORIGEN"}
      </button>

      <style>{`
        @keyframes floatBg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </div>
  );
}

const DynamicBackground = ({ level, stage }) => {
  const isNight = stage === "night";
  return (
    <div style={{
      position: "absolute", width: "100%", height: "100%", zIndex: -1,
      background: level === 1 
        ? (isNight ? "linear-gradient(-45deg, #000428, #004e92, #000428)" : "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)")
        : "linear-gradient(-45deg, #23074d, #000000, #440000)",
      backgroundSize: "400% 400%",
      animation: "floatBg 15s ease infinite",
      filter: level === 2 ? "contrast(1.5) brightness(0.8)" : "none",
      transition: "all 3s ease"
    }} />
  );
};

const styles = {
  quoteContainer: { position: "absolute", top: "15%", width: "100%", textAlign: "center", padding: "0 20px" },
  quoteText: { fontSize: "2rem", fontWeight: "300", fontStyle: "italic", textShadow: "0 2px 10px rgba(0,0,0,0.5)" },
  actionGrid: { position: "absolute", bottom: "15%", width: "100%", display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" },
  actionCard: { 
    width: "280px", padding: "20px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", 
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "15px", transition: "0.3s"
  },
  levelBtn: {
    position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)",
    padding: "10px 30px", background: "rgba(255,255,255,0.2)", border: "1px solid white",
    color: "white", borderRadius: "30px", cursor: "pointer", fontSize: "0.9rem"
  }
};
