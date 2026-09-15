/**
 * ============================================================================
 * AuthProvider · Sesión y roles  (patrón FACADE + OBSERVER)
 * ----------------------------------------------------------------------------
 * FACADE: por fuera esto expone 4 cositas simples (usuario, iniciarSesion,
 * cerrarSesion, tieneRol). Por dentro maneja el repositorio, la restauración
 * de la sesión guardada, los estados de carga y los errores. Los componentes
 * no necesitan saber nada de eso.
 *
 * OBSERVER: no hay que implementarlo a mano. Cuando `setUsuario` cambia el
 * estado, React vuelve a renderizar automáticamente TODOS los componentes que
 * usan `useAuth()`. El Navbar, el dashboard y las rutas protegidas se enteran
 * solos del login/logout. Eso ES el patrón Observer, ya resuelto por React.
 *
 * ⚠️ AUTENTICACIÓN SIMULADA: ver la advertencia completa en
 *    src/repositories/usuarioRepository.js
 * ==========================================================================*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { usuarioRepository } from "../repositories";
import { ROLES_DASHBOARD } from "../constantes";

export function AuthProvider({ children }) {
  /** Usuario logueado, o null si nadie inició sesión. */
  const [usuario, setUsuario] = useState(null);

  /**
   * `true` mientras revisamos si había una sesión guardada.
   * Es IMPORTANTE: sin esto, al recargar /dashboard el usuario vería un
   * parpadeo hacia el login antes de que se restaure su sesión.
   * <RutaProtegida> espera a que esto sea false antes de decidir.
   */
  const [cargando, setCargando] = useState(true);

  /** Último error de login, listo para mostrar en el formulario. */
  const [error, setError] = useState(null);

  /* ------------------------------------------------------------------------
   * Restaurar la sesión al montar la app (una sola vez).
   * --------------------------------------------------------------------- */
  useEffect(() => {
    let cancelado = false;

    async function restaurarSesion() {
      try {
        const guardado = await usuarioRepository.obtenerSesion();
        if (!cancelado) setUsuario(guardado);
      } catch (fallo) {
        console.error("[El Trigal] No se pudo restaurar la sesión:", fallo);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    restaurarSesion();

    // Evita avisar a un componente que ya se desmontó (React 19 en modo
    // estricto monta y desmonta dos veces en desarrollo).
    return () => {
      cancelado = true;
    };
  }, []);

  /* ------------------------------------------------------------------------
   * Acciones
   * --------------------------------------------------------------------- */

  /**
   * Inicia sesión.
   * @param {string} correo
   * @param {string} clave
   * @returns {Promise<object>} el usuario autenticado (útil para redirigir
   *                            según su rol justo después del login).
   * @throws {Error} si las credenciales no son válidas.
   */
  const iniciarSesion = useCallback(async (correo, clave) => {
    try {
      const autenticado = await usuarioRepository.autenticar(correo, clave);
      await usuarioRepository.guardarSesion(autenticado);
      setError(null);
      setUsuario(autenticado); // ← aquí se dispara el re-render global (Observer)
      return autenticado;
    } catch (fallo) {
      setError(fallo.message);
      throw fallo; // lo relanzamos para que el formulario también pueda reaccionar
    }
  }, []);

  /** Cierra la sesión y limpia el estado. */
  const cerrarSesion = useCallback(async () => {
    await usuarioRepository.cerrarSesion();
    setUsuario(null);
    setError(null);
  }, []);

  /** Limpia el mensaje de error (por ejemplo, al empezar a escribir de nuevo). */
  const limpiarError = useCallback(() => setError(null), []);

  /**
   * ¿El usuario actual tiene alguno de estos roles?
   * Es la base del control de acceso (<RutaProtegida>) y también sirve para
   * mostrar u ocultar botones según el rol.
   *
   * @param {...string} roles - uno o varios ROLES. Acepta también un arreglo.
   * @example tieneRol(ROLES.ADMIN)
   * @example tieneRol(ROLES.ADMIN, ROLES.CAJERO)
   */
  const tieneRol = useCallback(
    (...roles) => {
      if (!usuario) return false;
      const lista = roles.flat().filter(Boolean);
      if (lista.length === 0) return true; // sin roles pedidos: basta con estar logueado
      return lista.includes(usuario.rol);
    },
    [usuario],
  );

  /* ------------------------------------------------------------------------
   * Valor del contexto.
   * useMemo evita crear un objeto nuevo en cada render, lo que obligaría a
   * re-renderizar a TODOS los consumidores aunque nada haya cambiado.
   * --------------------------------------------------------------------- */
  const valor = useMemo(
    () => ({
      // Estado
      usuario,
      cargando,
      error,
      estaAutenticado: usuario !== null,
      rol: usuario?.rol ?? null,
      /** Atajo: ¿este usuario pertenece al personal de la tienda? */
      esPersonal: usuario ? ROLES_DASHBOARD.includes(usuario.rol) : false,

      // Acciones
      iniciarSesion,
      cerrarSesion,
      limpiarError,
      tieneRol,
    }),
    [usuario, cargando, error, iniciarSesion, cerrarSesion, limpiarError, tieneRol],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
