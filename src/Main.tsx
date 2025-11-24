import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import { checkMissingCSS } from "./utils/cssDebugger";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Production'da CSS kontrolü yap
if (import.meta.env.MODE === 'production') {
  setTimeout(() => {
    checkMissingCSS();
  }, 1000);
}
