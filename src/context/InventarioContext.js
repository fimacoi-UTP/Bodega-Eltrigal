/**
 * ============================================================================
 * InventarioContext · El objeto de contexto (solo la definición)
 * ----------------------------------------------------------------------------
 * Está separado del provider por la misma razón que AuthContext: para que el
 * Fast Refresh de Vite siga funcionando. La explicación completa está en
 * src/context/AuthContext.js
 *
 * El reparto es:
 *   InventarioContext.js    → esta definición
 *   InventarioProvider.jsx  → el componente con toda la lógica
 *   hooks/useInventario.js  → la forma de consumirlo (usen SIEMPRE esta)
 * ==========================================================================*/

import { createContext } from "react";

export const InventarioContext = createContext(null);
