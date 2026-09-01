import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Existing providers — KEEP THESE
import { LanguageProvider } from "./pages/vidura/dashboard/context/LanguageContext";
import { ThemeProvider } from "./pages/vidura/dashboard/context/ThemeContext";

// Authentication
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    {/* Authentication */}
    <AuthProvider>

      {/* Existing language system */}
      <LanguageProvider>

        {/* Existing theme system */}
        <ThemeProvider>

          {/* Main application */}
          <App />

        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>

  </React.StrictMode>
);