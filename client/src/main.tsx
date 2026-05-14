import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { registerSW } from "virtual:pwa-register";

import App from "./App"; 
import "./index.css"; 

// We will keep your ThemeProvider for now so we don't break old components,
// but we will eventually phase it out since Tailwind handles our theme!
import { ThemeProvider } from "./context/ThemeContext";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);