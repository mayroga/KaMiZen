import React from "react";
import useAmbientSound from "./useAmbientSound";

export default function LoadingScreen({ onReady }) {
  const { startSound } = useAmbientSound();

  const iniciar = () => {
    startSound();
    setTimeout(onReady, 800);
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(to top, #001a33, #000)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white"
    }}>
      <h1>KaMiZen</h1>
      <p>🌿 Respira… el ciclo comienza 🌿</p>
      <button onClick={iniciar} style={{ padding: "15px 40px" }}>
        ENTRAR
      </button>
    </div>
  );
}
