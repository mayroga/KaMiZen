import React, { useState, useEffect } from "react";

// Componente principal de la app KaMiZen
export default function App() {
  const [vital, setVital] = useState(null);
  const [microacciones, setMicroacciones] = useState([]);
  const [inactivo, setInactivo] = useState(0);

  // --- Cargar datos desde el backend ---
  const actualizarDatos = async () => {
    try {
      const res = await fetch(
        "http://localhost:8000/sensor_completo?pasos=2500&vasos_agua=5"
      );
      const data = await res.json();
      setVital(data);

      const mRes = await fetch("http://localhost:8000/microacciones");
      const mData = await mRes.json();
      setMicroacciones(mData);
    } catch (err) {
      console.error("Error cargando datos:", err);
    }
  };

  useEffect(() => {
    actualizarDatos();

    // Contador de inactividad
    const interval = setInterval(() => {
      setInactivo((prev) => prev + 1);
      if (inactivo === 59) alert("El ciclo requiere tu atención. Toca para continuar.");
    }, 1000);

    // Audio ambiental de fondo
    const audio = new Audio("/sounds/ambient.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(() => console.log("Reproducción automática bloqueada"));

    return () => clearInterval(interval);
  }, [inactivo]);

  if (!vital) return <div className="loading">Sincronizando con la vida...</div>;

  return (
    <div
      className="app-container"
      onClick={() => setInactivo(0)}
      style={styles.main}
    >
      {/* Fondo dinámico según estado vital */}
      <div
        style={{
          ...styles.bg,
          backgroundColor:
            vital.estado_vital === "Fuego"
              ? "#4a0000"
              : vital.estado_vital === "Tierra"
              ? "#654321"
              : vital.estado_vital === "Aire"
              ? "#003366"
              : "#004d00"
        }}
      />

      <header style={styles.header}>
        <span>{vital.hora_local}</span>
        <span>ESTADO: {vital.estado_vital}</span>
        <span>Nivel: {vital.nivel_usuario}</span>
      </header>

      <main style={styles.center}>
        <h1 style={styles.title}>TU ESPEJO VITAL</h1>
        <p style={styles.desc}>{vital.descripcion}</p>

        <div style={styles.statsGrid}>
          <div style={styles.card}>💧 {vital.metricas.hidratacion}</div>
          <div style={styles.card}>👣 {vital.metricas.movimiento}</div>
          <div style={styles.card}>🌐 {vital.metricas.conexion_entorno}</div>
        </div>

        <div style={{ marginTop: "40px" }}>
          <h2 style={{ textAlign: "center" }}>Microacciones del Día</h2>
          <ul>
            {microacciones.map((m) => (
              <li key={m.id}>
                {m.action} - {new Date(m.scheduled_at).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer style={styles.footer}>
        <button onClick={actualizarDatos} style={styles.btnRefresh}>
          Actualizar Datos
        </button>
      </footer>
    </div>
  );
}

// --- Estilos ---
const styles = {
  main: {
    width: "100vw",
    height: "100vh",
    color: "white",
    position: "relative",
    overflow: "hidden",
    fontFamily: "sans-serif"
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
    transition: "3s"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px",
    letterSpacing: "2px"
  },
  center: { textAlign: "center", marginTop: "10vh" },
  title: { fontSize: "3rem", fontWeight: "100", letterSpacing: "10px" },
  desc: { fontSize: "1.2rem", fontStyle: "italic", opacity: 0.8, margin: "20px" },
  statsGrid: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "40px",
    flexWrap: "wrap"
  },
  card: {
    padding: "20px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    backdropFilter: "blur(10px)",
    minWidth: "120px"
  },
  footer: { position: "absolute", bottom: "40px", width: "100%", textAlign: "center" },
  btnRefresh: {
    padding: "15px 40px",
    background: "white",
    color: "black",
    border: "none",
    cursor: "pointer",
    borderRadius: "30px",
    fontWeight: "bold"
  }
};
