/**
 * ============================================================================
 * main.jsx · Punto de arranque
 * ----------------------------------------------------------------------------
 * Un detalle importante: `inicializarDatos()` se llama ANTES de renderizar.
 * Así, cuando el InventarioContext pida los productos, el localStorage ya está
 * sembrado y no hay una primera pasada con el catálogo vacío.
 * ==========================================================================*/

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { inicializarDatos, reiniciarDatos } from "./repositories";
import "./index.css";

// 1. Preparar los datos (siembra desde src/data/ solo si hace falta).
inicializarDatos();

/* 2. Herramientas de desarrollo.
 *    Desde la consola del navegador pueden usar:
 *      window.elTrigal.reiniciarDatos()  → borra todo y vuelve a la semilla
 *
 *    Solo existe en desarrollo (import.meta.env.DEV), nunca en producción.
 *    Útil cuando de tanto probar les queda data rara en el navegador. */
if (import.meta.env.DEV) {
  window.elTrigal = { reiniciarDatos };
}

// 3. Renderizar.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
