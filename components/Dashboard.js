import React, { useState, useEffect } from "react";
import axios from "axios";
import MicroActions from "./MicroActions";

function Dashboard() {
  const [actions, setActions] = useState([]);
  const userId = 1; // demo

  useEffect(() => {
    axios.get(`http://localhost:8000/microactions/${userId}`)
      .then(res => setActions(res.data));
  }, []);

  const generateActions = () => {
    axios.post(`http://localhost:8000/microactions/generate/${userId}`)
      .then(res => setActions(res.data));
  };

  return (
    <div>
      <button onClick={generateActions}>Generar Acciones del Día</button>
      <MicroActions actions={actions} />
    </div>
  );
}

export default Dashboard;
