import React, { useState, useEffect } from "react";

export default function LoadingScreen({ onReady }) {
  const [textIndex, setTextIndex] = useState(0);
  const [seed] = useState(Math.random()); // Semilla única para que cada entrada sea distinta

  const philosophy = [
    "Cada segundo es una vida entera.",
    "Nacer, crecer, soltar, trascender.",
    "El equilibrio entre el caos y la calma.",
    "Tu pulso es el ritmo del universo.",
    "Lo que buscas, también te está buscando."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % philosophy.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    fetch(`/init?user_id=guest`).then(res => res.json()).then(onReady);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", position: "relative", overflow: "hidden",
      background: `radial-gradient(circle at ${seed * 100}% ${seed * 80}%, #1a2a6c, #b21f1f, #fdbb2d)`,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
    }}>
      {/* Capas de movimiento orgánico */}
      <div className="vortex" />
      
      <div style={{ zIndex: 10, textAlign: "center", color: "white", padding: "20px" }}>
        <h1 style={{ fontSize: "5rem", fontWeight: "100", letterSpacing: "20px", margin: 0 }}>KaMiZen</h1>
        <div style={{ height: "60px", margin: "20px 0" }}>
           <p key={textIndex} className="fade-text" style={{ fontSize: "1.5rem", fontStyle: "italic", opacity: 0.8 }}>
            {philosophy[textIndex]}
          </p>
        </div>
        
        <button onClick={handleStart} className="btn-entrar">
          INICIAR EXPERIENCIA ÚNICA
        </button>
      </div>

      <style>{`
        .vortex {
          position: absolute; width: 200%; height: 200%;
          background: url('https://www.transparenttextures.com/patterns/asfalt-dark.png');
          opacity: 0.15; animation: rotateVortex ${60 + seed * 20}s linear infinite;
        }
        @keyframes rotateVortex { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-text { animation: fadeInOut 4s ease-in-out infinite; }
        @keyframes fadeInOut { 0%, 100% { opacity: 0; transform: translateY(10px); } 50% { opacity: 1; transform: translateY(0); } }
        .btn-entrar {
          padding: 20px 60px; background: none; border: 1px solid white; color: white;
          font-size: 1.2rem; cursor: pointer; transition: 0.5s; letter-spacing: 5px;
        }
        .btn-entrar:hover { background: white; color: black; box-shadow: 0 0 30px white; }
      `}</style>
    </div>
  );
}
