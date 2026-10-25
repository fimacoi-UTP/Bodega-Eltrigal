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
import { authApi, guardarUsuarioSesion } from "../api/authApi";
import { esAdmin, esCajero, esCliente, esPersonal } from "../auth/permisos";
import {
  limpiarCarritoStorage,
  obtenerDuenoCarritoStorage,
  guardarDuenoCarritoStorage,
} from "./carritoStorage";

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
        const guardado = authApi.obtenerUsuarioSesion();
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
   * Inicia sesión llamando a la API de autenticación del backend Spring Boot.
   * Si había un carrito de otro usuario previo, se limpia para no mezclar cuentas.
   *
   * @param {string} correo
   * @param {string} clave
   * @returns {Promise<object>} el usuario autenticado
   * @throws {Error} si las credenciales no son válidas.
   */
  const iniciarSesion = useCallback(async (correo, clave) => {
    try {
      const autenticado = await authApi.login(correo, clave);
      setError(null);

      // Si el carrito tenía un dueño asignado y no coincide con el nuevo usuario,
      // se limpia para no mezclar carritos entre cuentas distintas.
      // Si era de un invitado (dueno == null o "invitado"), se conserva.
      const nuevoId = String(autenticado.id ?? autenticado.email ?? "");
      const duenoAnterior = obtenerDuenoCarritoStorage();

      if (duenoAnterior && duenoAnterior !== "invitado" && duenoAnterior !== nuevoId) {
        limpiarCarritoStorage();
      }

      if (nuevoId) {
        guardarDuenoCarritoStorage(nuevoId);
      }

      setUsuario(autenticado); // ← aquí se dispara el re-render global (Observer)
      return autenticado;
    } catch (fallo) {
      setError(fallo.message);
      throw fallo; // lo relanzamos para que el formulario también pueda reaccionar
    }
  }, []);

  /**
   * Registra un nuevo cliente llamando a la API y autologueándolo con su token JWT.
   * @param {object} datos - { nombres, apellidos, email, telefono, password }
   * @returns {Promise<object>} el usuario autenticado.
   * @throws {Error} si el registro falla (ej: correo ya registrado).
   */
  const registrarse = useCallback(async (datos) => {
    try {
      const autenticado = await authApi.registro(datos);
      setError(null);

      const nuevoId = String(autenticado.id ?? autenticado.email ?? "");
      const duenoAnterior = obtenerDuenoCarritoStorage();

      if (duenoAnterior && duenoAnterior !== "invitado" && duenoAnterior !== nuevoId) {
        limpiarCarritoStorage();
      }

      if (nuevoId) {
        guardarDuenoCarritoStorage(nuevoId);
      }

      setUsuario(autenticado);
      return autenticado;
    } catch (fallo) {
      setError(fallo.message);
      throw fallo;
    }
  }, []);

  /** Cierra la sesión, limpia token, usuario y vacía el carrito de compras. */
  const cerrarSesion = useCallback(async () => {
    try {
      authApi.logout();
    } catch (fallo) {
      console.warn("[El Trigal] Error en authApi.logout():", fallo);
    }

    // Vaciar y limpiar claves del carrito en localStorage + emitir evento
    limpiarCarritoStorage();

    setUsuario(null);
    setError(null);
  }, []);

  /** Limpia el mensaje de error (por ejemplo, al empezar a escribir de nuevo). */
  const limpiarError = useCallback(() => setError(null), []);

  /**
   * Actualiza los datos de la sesión del usuario actual de manera estable,
   * recalcula el nombre completo cuando se actualizan nombres/apellidos,
   * y persiste en localStorage.
   * @param {object} datos
   */
  const actualizarSesion = useCallback((datos) => {
    setUsuario((prev) => {
      if (!prev) return prev;
      const fusion = { ...prev, ...datos };
      if (datos.nombres != null || datos.apellidos != null) {
        fusion.nombre = `${fusion.nombres ?? ""} ${fusion.apellidos ?? ""}`.trim();
      }
      try {
        guardarUsuarioSesion(fusion);
      } catch {
        /* noop */
      }
      return fusion;
    });
  }, []);

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
      /** Atajos de permisos derivados de la sesión */
      esAdmin: esAdmin(usuario),
      esCajero: esCajero(usuario),
      esCliente: esCliente(usuario),
      esPersonal: esPersonal(usuario),

      // Acciones
      iniciarSesion,
      registrarse,
      cerrarSesion,
      limpiarError,
      tieneRol,
      actualizarSesion,
    }),
    [
      usuario,
      cargando,
      error,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      limpiarError,
      tieneRol,
      actualizarSesion,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
