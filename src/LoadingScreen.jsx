import React, { useEffect } from "react";

export default function LoadingScreen({ onReady }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onReady();
    }, 2500); // tiempo fijo, controlado

    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(to top, #001a33, #000)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "1.8rem"
    }}>
      🌿 Relájate... Cargando experiencia 🌿
    </div>
  );
}
