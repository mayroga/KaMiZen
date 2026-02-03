import React, { useState } from "react";

export default function LoadingScreen({ onReady }) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      // Ajusta la URL según tu entorno (local o producción)
      const response = await fetch(`http://localhost:8000/init?user_id=guest&lang=es`);
      const data = await response.json();
      
      // Simulación de carga para la animación
      setTimeout(() => {
        onReady(data);
      }, 1500);
    } catch (err) {
      console.error("Error al iniciar KaMiZen:", err);
      onReady(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <h1 style={styles.title}>KaMiZen</h1>
        {!loading ? (
          <button style={styles.button} onClick={handleStart}>
            Iniciar Experiencia
          </button>
        ) : (
          <p style={styles.text}>🌿 Preparando tu espacio de paz... 🌿</p>
        )}
      </div>
      <div style={styles.bgAnimation} />
    </div>
  );
}

const styles = {
  container: {
    width: "100vw", height: "100vh", backgroundColor: "#223344",
    display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden"
  },
  overlay: { zIndex: 10, textAlign: "center", color: "white" },
  title: { fontSize: "3rem", marginBottom: "2rem", letterSpacing: "5px" },
  button: {
    padding: "15px 40px", fontSize: "1.2rem", cursor: "pointer",
    backgroundColor: "transparent", border: "2px solid white", color: "white", borderRadius: "30px"
  },
  text: { fontSize: "1.2rem", fontStyle: "italic" },
  bgAnimation: {
    position: "absolute", width: "100%", height: "100%",
    background: "radial-gradient(circle, #445566 0%, #223344 100%)", zIndex: 1
  }
};
