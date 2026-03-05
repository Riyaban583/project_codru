import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Notice we removed the .jsx extension here! 
// Vite is smart enough to find App.tsx automatically.
import App from "./App"; 

// This brings in all your new Tailwind styles
import "./index.css"; 

// We will keep your ThemeProvider for now so we don't break old components,
// but we will eventually phase it out since Tailwind handles our theme!
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);