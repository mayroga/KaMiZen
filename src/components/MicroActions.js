import React from "react";

function MicroActions({ actions }) {
  return (
    <ul>
      {actions.map(a => (
        <li key={a.id}>
          {a.action} - {new Date(a.scheduled_at).toLocaleTimeString()}
        </li>
      ))}
    </ul>
  );
}

export default MicroActions;
