/**
 * ============================================================================
 * AuthContext · El objeto de contexto (solo la definición)
 * ----------------------------------------------------------------------------
 * ¿Por qué este archivo tiene UNA sola línea útil y está separado del provider?
 *
 * Por el Fast Refresh de Vite. Para que al guardar un archivo React actualice
 * la pantalla SIN perder el estado, un archivo debe exportar únicamente
 * componentes. Si mezclamos el componente <AuthProvider> con la constante
 * AuthContext en el mismo archivo, Vite ya no puede refrescar en caliente y
 * recarga la página entera (perdiendo la sesión, los formularios a medio
 * llenar, etc.). ESLint nos lo avisa con la regla
 * `react-refresh/only-export-components`.
 *
 * Por eso el reparto es:
 *   AuthContext.js    → esta definición
 *   AuthProvider.jsx  → el componente con toda la lógica
 *   hooks/useAuth.js  → la forma de consumirlo (usen SIEMPRE esta)
 * ==========================================================================*/

import { createContext } from "react";

/**
 * No consuman este contexto directo con useContext(AuthContext).
 * Usen el hook `useAuth()` de src/hooks/useAuth.js, que además valida que
 * estén dentro del Provider y da un error claro si no.
 */
export const AuthContext = createContext(null);
