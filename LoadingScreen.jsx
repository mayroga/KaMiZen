import React, { useState, useEffect } from "react";

export default function LoadingScreen({ onReady }) {
  const [phase, setPhase] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  // Ciclo de vida visual: cambia colores y mensajes para que NUNCA sea igual
  const lifeCycles = [
    { text: "Respirar...", color: "#1a2a6c" },
    { text: "Existir...", color: "#b21f1f" },
    { text: "Sentir...", color: "#fdbb2d" },
    { text: "Trascender...", color: "#22c1c3" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % lifeCycles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const startApp = () => {
    setIsStarting(true);
    fetch(`http://localhost:8000/init?user_id=guest&lang=es`)
      .then(res => res.json())
      .then(data => setTimeout(() => onReady(data), 1200))
      .catch(() => onReady({ stage: "unknown", is_premium: false }));
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
      backgroundColor: lifeCycles[phase].color, transition: "background-color 2s ease-in-out", overflow: "hidden", position: "relative"
    }}>
      {/* Vórtice de Vida: Partículas aleatorias */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: Math.random() * 10 + "px",
          height: Math.random() * 10 + "px",
          background: "white",
          borderRadius: "50%",
          opacity: 0.3,
          left: Math.random() * 100 + "%",
          top: Math.random() * 100 + "%",
          animation: `float ${3 + Math.random() * 5}s infinite linear`
        }} />
      ))}

      <div style={{ zIndex: 10, textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "4rem", letterSpacing: "15px", fontWeight: "200", textShadow: "0 0 20px rgba(255,255,255,0.5)" }}>KaMiZen</h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "40px", opacity: 0.8 }}>{lifeCycles[phase].text}</p>
        
        {!isStarting ? (
          <button onClick={startApp} style={styles.btnStart}>RECONOCER EL CICLO</button>
        ) : (
          <div className="pulse-loader"></div>
        )}
      </div>

      <style>{`
        @keyframes float { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-100vh) scale(0); } }
        .pulse-loader { width: 50px; height: 50px; border: 2px solid white; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>
    </div>
  );
}

const styles = {
  btnStart: {
    padding: "20px 50px", fontSize: "1rem", background: "none", border: "1px solid white",
    color: "white", borderRadius: "2px", cursor: "pointer", letterSpacing: "4px", transition: "0.5s"
  }
};
