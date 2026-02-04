import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";

export default function App() {
  const [vital, setVital] = useState(null);
  const [microacciones, setMicroacciones] = useState([]);
  const [inactivo, setInactivo] = useState(0);

  // Audio ambiental
  const playAudio = () => {
    const audio = new Audio("/sounds/ambient.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch(()=>{});
  };

  useEffect(() => {
    playAudio();
    actualizarDatos();
    const interval = setInterval(() => {
      setInactivo(prev => prev + 1);
      if (inactivo === 59) alert("El ciclo requiere tu atención. Toca para continuar.");
    }, 1000);
    return () => clearInterval(interval);
  }, [inactivo]);

  const actualizarDatos = async () => {
    const res = await fetch("/sensor_completo?user_id=1&pasos=2500&vasos_agua=5");
    const data = await res.json();
    setVital(data);

    const mRes = await fetch("/microacciones?user_id=1");
    const mData = await mRes.json();
    setMicroacciones(mData);
  };

  const generarPDF = async () => {
    const res = await fetch("/reporte_vital_data?user_id=1");
    const data = await res.json();
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("KaMiZen: REPORTE VITAL 24H", 10, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Usuario: ${data.usuario}`, 10, 30);
    doc.text(`Nivel: ${data.nivel}`, 10, 40);
    doc.text(`Microacciones completadas:`, 10, 50);
    data.microacciones_completadas.forEach((m, i) => doc.text(`- ${m}`, 10, 60 + i*10));
    doc.save("Reporte_Vital_KaMiZen.pdf");
  };

  if (!vital) return <div style={{textAlign:"center",marginTop:"20vh"}}>Sincronizando con la vida...</div>;

  return (
    <div style={{width:"100vw",height:"100vh",color:"white",backgroundColor: vital.estado_vital==="Fuego"?"#4a0000":"#001a33",padding:20}}>
      <header style={{display:"flex",justifyContent:"space-between"}}>
        <span>{vital.hora_local}</span>
        <span>ESTADO: {vital.estado_vital}</span>
        <span>NIVEL: {vital.nivel_usuario}</span>
      </header>

      <main style={{textAlign:"center",marginTop:40}}>
        <h1>Tu Espejo Vital</h1>
        <p>{vital.descripcion}</p>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:20}}>
          <div>💧 {vital.metricas.hidratacion}</div>
          <div>👣 {vital.metricas.movimiento}</div>
        </div>
        <h2>Microacciones de Hoy</h2>
        <ul>
          {microacciones.map(m => (
            <li key={m.id}>
              {m.action} - {new Date(m.scheduled_at).toLocaleTimeString()} {m.done?"✅":""}
            </li>
          ))}
        </ul>
      </main>

      <footer style={{position:"absolute",bottom:20,width:"100%",textAlign:"center"}}>
        <button onClick={generarPDF} style={{padding:"10px 30px",borderRadius:20,cursor:"pointer"}}>DESCARGAR REPORTE PDF</button>
      </footer>
    </div>
  );
}
