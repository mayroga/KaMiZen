import React, { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

export default function App() {
  const [vitalData, setVitalData] = useState(null);
  const [level, setLevel] = useState(1);
  const [coords, setCoords] = useState(null);

  // Capturar la ubicación para conectar con el clima real
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => console.warn("Ubicación denegada. Usando clima neutro.")
    );
  }, []);

  const handleStart = async () => {
    const url = coords ? `/init_vital?lat=${coords.lat}&lon=${coords.lon}` : `/init_vital`;
    const res = await fetch(url);
    const data = await res.json();
    setVitalData(data);
  };

  if (!vitalData) return <LoadingScreen onReady={handleStart} />;

  const { weather, sentiment, is_dark, time } = vitalData.context;

  return (
    <div style={styles.container}>
      {/* FONDO SENSORIAL: Cambia por Clima y Sentimiento */}
      <div style={{
        ...styles.sky,
        background: getBackground(weather, is_dark, level),
        filter: sentiment === "melancholy" ? "grayscale(0.4)" : "none"
      }} />

      {/* EFECTOS DE CLIMA REAL (Lluvia, Nieve, etc) */}
      {weather === "rain" && <div className="rain-effect" />}

      <div style={styles.overlay}>
        <div style={styles.topInfo}>
          <span>ZONA: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          <span>HORA VITAL: {time}</span>
        </div>

        <h1 style={styles.vitalTitle}>
          {level === 1 ? "EL CICLO DIARIO" : "EL FLUJO INVISIBLE"}
        </h1>

        <div style={styles.insightBox}>
          <p>{vitalData.microactions?.[0].m || "Conectando con tu entorno..."}</p>
        </div>

        <button style={styles.btnSwitch} onClick={() => setLevel(level === 1 ? 2 : 1)}>
          {level === 1 ? "SENTIR LO PROFUNDO" : "REGRESAR AL CUERPO"}
        </button>
      </div>

      <style>{`
        .rain-effect {
          position: absolute; width: 100%; height: 100%;
          background: url('https://raw.githubusercontent.com/PiyushSuthar/Rain-Effect/master/rain.png');
          animation: rain 0.3s linear infinite; opacity: 0.3;
        }
        @keyframes rain { 0% { background-position: 0 0; } 100% { background-position: 20% 100%; } }
      `}</style>
    </div>
  );
}

const getBackground = (weather, isDark, level) => {
  if (level === 2) return "radial-gradient(circle, #000, #1a0033)";
  if (weather === "rain") return "linear-gradient(to bottom, #4b617a, #203943)";
  if (isDark) return "linear-gradient(to bottom, #0f2027, #2c5364)";
  return "linear-gradient(to bottom, #74ebd5, #acb6e5)";
};

const styles = {
  container: { width: "100vw", height: "100vh", position: "relative", overflow: "hidden", color: "#fff" },
  sky: { position: "absolute", width: "100%", height: "100%", zIndex: -1, transition: "all 4s ease" },
  topInfo: { display: "flex", justifyContent: "space-between", padding: "20px", fontSize: "0.8rem", letterSpacing: "2px", opacity: 0.6 },
  vitalTitle: { textAlign: "center", fontSize: "3rem", fontWeight: "100", marginTop: "10vh", letterSpacing: "10px" },
  insightBox: { 
    margin: "100px auto", maxWidth: "500px", padding: "30px", 
    background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", 
    border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" 
  },
  btnSwitch: {
    position: "absolute", bottom: "50px", left: "50%", transform: "translateX(-50%)",
    padding: "15px 40px", background: "none", border: "1px solid #fff", color: "#fff", cursor: "pointer"
  }
};
