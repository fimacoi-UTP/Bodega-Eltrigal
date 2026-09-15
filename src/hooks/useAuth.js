/**
 * ============================================================================
 * useAuth · La puerta de entrada a la sesión
 * ----------------------------------------------------------------------------
 * @example
 * import { useAuth } from '../../hooks/useAuth'
 *
 * function MiComponente() {
 *   const { usuario, estaAutenticado, tieneRol, cerrarSesion } = useAuth()
 *
 *   if (!estaAutenticado) return <p>Inicia sesión para continuar</p>
 *
 *   return (
 *     <>
 *       <p>Hola, {usuario.nombre}</p>
 *       {tieneRol(ROLES.ADMIN) && <Boton>Eliminar producto</Boton>}
 *       <Boton onClick={cerrarSesion}>Salir</Boton>
 *     </>
 *   )
 * }
 * ==========================================================================*/

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const contexto = useContext(AuthContext);

  // Este error atrapa el olvido más común: usar el hook fuera del Provider.
  // Sin esta comprobación, el síntoma sería un críptico "cannot read property
  // 'usuario' of null" en cualquier parte del árbol.
  if (contexto === null) {
    throw new Error(
      "useAuth() debe usarse dentro de <AuthProvider>. " +
        "Revisa que src/App.jsx envuelva la aplicación con el provider.",
    );
  }

  return contexto;
}
