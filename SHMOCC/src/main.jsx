import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { LanguageProvider } from "./pages/vidura/dashboard/context/LanguageContext";
import { ThemeProvider } from "./pages/vidura/dashboard/context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);