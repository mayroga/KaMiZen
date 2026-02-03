import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

export default function App() {
  const [vital, setVital] = useState(null);

  useEffect(() => {
    actualizarSensor();
    const interval = setInterval(actualizarSensor, 15000);
    return () => clearInterval(interval);
  }, []);

  const actualizarSensor = async () => {
    try {
      const res = await fetch("/sensor_completo?pasos=2500&vasos_agua=5");
      const data = await res.json();
      setVital(data);
    } catch (e) {
      console.error("Error sensor:", e);
    }
  };

  const generarPDF = () => {
    if (!vital) return;
    const doc = new jsPDF();
    doc.text("KaMiZen - Reporte Vital", 10, 20);
    doc.text(`Estado: ${vital.estado_vital}`, 10, 40);
    doc.text(vital.descripcion, 10, 60);
    doc.save("KaMiZen_Reporte.pdf");
  };

  if (!vital) return <div style={{ color: "white" }}>Cargando estado vital...</div>;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: vital.estado_vital === "Fuego" ? "#4a0000" : "#001a33",
      color: "white",
      padding: "40px"
    }}>
      <h1>KaMiZen</h1>
      <h2>{vital.estado_vital}</h2>
      <p>{vital.descripcion}</p>

      <p>💧 {vital.metricas.hidratacion}</p>
      <p>👣 {vital.metricas.movimiento}</p>

      <button onClick={generarPDF}>Descargar PDF</button>
    </div>
  );
}
