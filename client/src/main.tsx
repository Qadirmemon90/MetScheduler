import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <App/>
          </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
