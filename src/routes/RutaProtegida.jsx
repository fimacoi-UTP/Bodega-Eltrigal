/**
 * ============================================================================
 * RutaProtegida · Control de acceso  (patrón PROXY)
 * ----------------------------------------------------------------------------
 * ¿POR QUÉ ESTO ES UN PROXY?
 * Un Proxy es un objeto que se pone DELANTE de otro y controla el acceso a él,
 * manteniendo la misma interfaz. Eso es exactamente lo que hace este
 * componente: se coloca delante de la página real y decide si la deja pasar,
 * si redirige al login o si muestra "sin acceso".
 *
 * Lo importante: la página protegida NO SABE que está protegida. No tiene ni
 * una línea de código de permisos. Si mañana el dashboard se abre al público,
 * se quita este envoltorio y la página sigue funcionando igual.
 *
 * ┌── Cómo decide ──────────────────────────────────────────────────────────┐
 * │ 1. ¿Todavía estamos restaurando la sesión?  → mostrar "Cargando"        │
 * │    (Sin este paso, al recargar /dashboard el usuario vería un parpadeo  │
 * │     hacia el login antes de que su sesión se restaure. Bug clásico.)    │
 * │ 2. ¿No hay sesión?          → mandar a /login, recordando a dónde iba   │
 * │ 3. ¿Hay sesión pero el rol no alcanza? → pantalla de "Sin acceso"       │
 * │ 4. Todo bien                → renderizar la página                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ⚠️⚠️ ESTO NO ES SEGURIDAD REAL ⚠️⚠️
 * Este control vive en el navegador, y el navegador es del usuario. Cualquiera
 * puede editar el localStorage desde las DevTools y ponerse rol ADMIN. Hoy
 * sirve para que la navegación funcione y para la demo del curso.
 * La seguridad de verdad llega con Spring Security en el backend:
 * @PreAuthorize("hasRole('ADMIN')") validando CADA petición en el servidor.
 * Cuando eso exista, este componente se queda igual, pero pasa a ser solo
 * una comodidad visual (no mostrarle al usuario pantallas que no puede usar).
 *
 * @example Solo hay que estar logueado (cualquier rol)
 * <RutaProtegida><MiPagina /></RutaProtegida>
 *
 * @example Un rol específico
 * <RutaProtegida rol={ROLES.ADMIN}><GestionProductos /></RutaProtegida>
 *
 * @example Varios roles
 * <RutaProtegida rol={[ROLES.ADMIN, ROLES.CAJERO]}><Outlet /></RutaProtegida>
 * ==========================================================================*/

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Cargando } from "../components/ui";
import SinAccesoPage from "../pages/SinAccesoPage";
import { RUTAS } from "./rutas";

export function RutaProtegida({
  /** Rol o lista de roles permitidos. Si se omite, basta con estar logueado. */
  rol,
  children,
}) {
  const { estaAutenticado, cargando, tieneRol } = useAuth();
  const ubicacion = useLocation();

  // --- 1. Aún no sabemos si hay sesión: esperamos ---------------------------
  if (cargando) {
    return <Cargando pantallaCompleta texto="Verificando tu sesión…" />;
  }

  // --- 2. No hay sesión: al login ------------------------------------------
  if (!estaAutenticado) {
    return (
      <Navigate
        to={RUTAS.LOGIN}
        // Guardamos a dónde quería ir para devolverlo ahí después del login.
        // `replace` evita que el botón "atrás" lo regrese a la página bloqueada.
        state={{ desde: ubicacion.pathname }}
        replace
      />
    );
  }

  // --- 3. Hay sesión pero el rol no alcanza --------------------------------
  // Ojo: NO redirigimos al login (sería confuso, ya inició sesión). Le
  // explicamos que su cuenta no tiene permiso para esta sección.
  if (rol && !tieneRol(rol)) {
    return <SinAccesoPage rolesRequeridos={[].concat(rol)} />;
  }

  // --- 4. Adelante ---------------------------------------------------------
  // `children` para uso directo; <Outlet /> cuando protege un grupo de rutas
  // anidadas (así se protege todo el dashboard de una sola vez).
  return children ?? <Outlet />;
}

export default RutaProtegida;
