import React, { useState } from "react";

const PreloadAnimation = () => {
  const clouds = [];
  const particles = [];
  for (let i = 0; i < 5; i++) {
    const top = Math.random() * 50;
    const left = Math.random() * 100;
    const size = 50 + Math.random() * 50;
    clouds.push(
      <div key={`cloud-${i}`} style={{
        position: "absolute", top: `${top}%`, left: `${left}%`, width: `${size}px`, height: `${size / 2}px`,
        background: "rgba(255,255,255,0.3)", borderRadius: "50%", animation: `cloudMove ${20 + Math.random() * 10}s linear infinite`
      }}></div>
    );
  }
  for (let i = 0; i < 15; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    particles.push(
      <div key={`particle-${i}`} style={{
        position: "absolute", top: `${top}%`, left: `${left}%`, width: "4px", height: "4px",
        background: "white", borderRadius: "50%", animation: `particleMove ${5 + Math.random() * 5}s linear infinite alternate`
      }}></div>
    );
  }
  return <>{clouds}{particles}</>;
};

export default function LoadingScreen({ onReady }) {
  const [isStarting, setIsStarting] = useState(false);

  const startApp = () => {
    setIsStarting(true);
    // Llamada al backend para inicializar
    fetch(`http://localhost:8000/init?user_id=guest&lang=es`)
      .then(res => res.json())
      .then(data => {
        setTimeout(() => onReady(data), 1000);
      })
      .catch(err => {
        console.warn("Error al conectar con KaMiZen:", err);
        onReady(null);
      });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#223344", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <PreloadAnimation />
      <div style={{ zIndex: 10, textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "3.5em", marginBottom: "20px", letterSpacing: "8px" }}>KaMiZen</h1>
        {!isStarting ? (
          <button 
            onClick={startApp}
            style={{ padding: "15px 40px", fontSize: "1.2em", background: "transparent", border: "2px solid white", color: "white", borderRadius: "50px", cursor: "pointer", transition: "0.3s" }}
            onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={(e) => e.target.style.background = "transparent"}
          >
            ENTRAR
          </button>
        ) : (
          <p style={{ fontSize: "1.5em", fontStyle: "italic" }}>🌿 Relájate... Cargando experiencia 🌿</p>
        )}
      </div>
      <style>{`
        @keyframes cloudMove { 0% { transform: translateX(-10%); } 100% { transform: translateX(110%); } }
        @keyframes particleMove { 0% { transform: translateY(0); } 100% { transform: translateY(-20px); } }
      `}</style>
    </div>
  );
}
