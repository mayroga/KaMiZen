import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import LoadingScreen from "./LoadingScreen";

function Root() {
  const [ready, setReady] = useState(false);

  return ready ? <App /> : <LoadingScreen onReady={() => setReady(true)} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);
