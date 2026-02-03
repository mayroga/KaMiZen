import React, { useState, useEffect } from "react";
import jsPDF from "jspdf"; // Librería para generar el PDF

export default function App() {
  const [vital, setVital] = useState(null);
  const [stats, setStats] = useState({ pasos: 2500, agua: 5 });
  const [inactivo, setInactivo] = useState(0);

  useEffect(() => {
    actualizarSensor();
    const interval = setInterval(() => {
        setInactivo(prev => prev + 1);
        if (inactivo === 59) alert("El ciclo requiere tu atención. Toca para continuar.");
    }, 1000);
    return () => clearInterval(interval);
  }, [inactivo]);

  const actualizarSensor = async () => {
    const res = await fetch(`/sensor_completo?pasos=${stats.pasos}&vasos_agua=${stats.agua}`);
    const data = await res.json();
    setVital(data);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("KaMiZen: REPORTE VITAL 24 HORAS", 10, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 30);
    doc.text(`Estado Final: ${vital.estado_vital}`, 10, 40);
    doc.text(`Resumen: Hoy pasaste de Fuego a Equilibrio.`, 10, 50);
    doc.text(`Hidratación: ${vital.metricas.hidratacion}`, 10, 60);
    doc.text(`Conexión: ${vital.metricas.conexion_entorno}`, 10, 70);
    doc.save("Reporte_Vital_KaMiZen.pdf");
  };

  if (!vital) return <div className="loading">Sincronizando con la vida...</div>;

  return (
    <div className="app-container" onClick={() => setInactivo(0)} style={styles.main}>
      {/* Fondo dinámico basado en el estado vital */}
      <div style={{...styles.bg, backgroundColor: vital.estado_vital === "Fuego" ? "#4a0000" : "#001a33"}} />

      <header style={styles.header}>
        <span>{vital.hora_local}</span>
        <span>ESTADO: {vital.estado_vital}</span>
      </header>

      <main style={styles.center}>
        <h1 style={styles.title}>TU ESPEJO VITAL</h1>
        <p style={styles.desc}>{vital.descripcion}</p>
        
        <div style={styles.statsGrid}>
            <div style={styles.card}>💧 {vital.metricas.hidratacion}</div>
            <div style={styles.card}>👣 {vital.metricas.movimiento}</div>
        </div>
      </main>

      <footer style={styles.footer}>
        <button onClick={generarPDF} style={styles.btnPdf}>DESCARGAR REPORTE VITAL (PDF)</button>
      </footer>
    </div>
  );
}

const styles = {
  main: { width: "100vw", height: "100vh", color: "white", position: "relative", overflow: "hidden" },
  bg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, transition: "3s" },
  header: { display: "flex", justifyContent: "space-between", padding: "20px", letterSpacing: "2px" },
  center: { textAlign: "center", marginTop: "10vh" },
  title: { fontSize: "3rem", fontWeight: "100", letterSpacing: "10px" },
  desc: { fontSize: "1.2rem", fontStyle: "italic", opacity: 0.8, margin: "20px" },
  statsGrid: { display: "flex", justifyContent: "center", gap: "20px", marginTop: "40px" },
  card: { padding: "20px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", backdropFilter: "blur(10px)" },
  footer: { position: "absolute", bottom: "40px", width: "100%", textAlign: "center" },
  btnPdf: { padding: "15px 40px", background: "white", color: "black", border: "none", cursor: "pointer", borderRadius: "30px", fontWeight: "bold" }
};
